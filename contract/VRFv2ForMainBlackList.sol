// SPDX-License-Identifier: MIT
// An example of a consumer contract that relies on a subscription for funding.
pragma solidity ^0.8.6;

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MoonDAOWinner is Ownable,VRFConsumerBaseV2 {
  VRFCoordinatorV2Interface COORDINATOR;
  LinkTokenInterface LINKTOKEN = LinkTokenInterface(0x514910771AF9Ca656af840dff83E8264EcF986CA); //https://vrf.chain.link/mainnet
  bytes32 keyHash =  0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef; //200gwei
  address vrfCoordinator_  = 0x271682DEB8C4E0901D1a1550aD2e64D568E69909;  
    // Your subscription ID.
  uint64 public s_subscriptionId; 
  
  uint16 requestConfirmations = 4;
  uint32 numWords =  1;  
  mapping(uint256 => uint256) s_requestIdToRequestIndex;
  mapping(uint256 => uint) public diceList;
  mapping(uint256 => uint16) public winnerNFTList;
  

  uint256 public roll_Counter;

  //events
  event DiceRolled(uint256 indexed requestId, uint256 indexed requestNumber,uint256 indexed dice);

  uint16[5] public NFTBlacklist =[0,3,6,10,12];
  uint public maxLen = 8003;
  uint16 public lenBlack =uint16(NFTBlacklist.length);

  function reMapping(
      uint16 rolledNum 
  )public view returns(uint16 NFTID){  
    if(rolledNum<NFTBlacklist[0]){
      NFTID= rolledNum;
    }else if (rolledNum+lenBlack > NFTBlacklist[lenBlack-1]){
      NFTID= rolledNum + lenBlack;
    }else {
      for(uint16 i=1; i<lenBlack-1; i++){
        if(rolledNum+i>NFTBlacklist[i-1] && rolledNum+i<NFTBlacklist[i]){
          NFTID = rolledNum+i;
          break;
        } 
      } 
    }   
  }


  function setsubscript(
      uint64 subscriptionId_ 
    )external onlyOwner {
    s_subscriptionId=subscriptionId_; 
  }


  constructor(
    uint64 subscriptionId_    
  ) VRFConsumerBaseV2(vrfCoordinator_) {
    COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator_);
    s_subscriptionId = subscriptionId_; 
  }

   
  function RollTheDice() external onlyOwner { 
    uint32 callbackGasLimit = 300000;
    uint256 requestId  = COORDINATOR.requestRandomWords(
      keyHash,
      s_subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
    s_requestIdToRequestIndex[requestId] = roll_Counter;
    roll_Counter += 1;
  } 
  
  function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
  ) internal override {
    uint s_randomWord = randomWords[0];
    uint dice= s_randomWord % (maxLen - NFTBlacklist.length);
    uint256 requestNumber = s_requestIdToRequestIndex[requestId];
    diceList[requestNumber] = dice;

    emit DiceRolled(requestId,requestNumber,dice);
  } 


  function reMappingAList() external onlyOwner{  
    //sort diceList to a and c。
    uint16[] memory a = new uint16[](roll_Counter); 
    uint[] memory c = new uint[](roll_Counter);
    for(uint i=0;i< roll_Counter;i++){
      a[i] = uint16(diceList[i]);
      c[i] = i;
    }
    (a,c) = insertionSort(a,c); 
      
    uint16 reci=1;

    for(uint index=0;index<roll_Counter;index++){
      uint16 rolledNum = a[index];  
      if(rolledNum<NFTBlacklist[0]){
        winnerNFTList[c[index]]= rolledNum;      
      }else if (rolledNum+lenBlack > NFTBlacklist[lenBlack-1]){
        winnerNFTList[c[index]]= rolledNum + lenBlack;
      }else {
        for(uint16 i=reci; i<lenBlack-1; i++){
          if(rolledNum+i>NFTBlacklist[i-1] && rolledNum+i<NFTBlacklist[i]){
            winnerNFTList[c[index]] = rolledNum+i;
            reci=i;
            break;
          } 
        } 
      } 
    }
  }

  function insertionSort(uint16[] memory a,uint[] memory c) public pure returns(uint16[] memory ,uint[] memory ) {
      for (uint i = 1;i < a.length;i++){
          uint16 temp = a[i];
          uint temp2 = c[i];
          uint j=i;
          while( (j >= 1) && (temp < a[j-1])){
              a[j] = a[j-1];
              c[j] = c[j-1];
              j--;
          }
          a[j] = temp;
          c[j] = temp2;
      }
      return(a,c);
  }

}
