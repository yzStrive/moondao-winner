declare const window: any;
export const switchNetwork = async (targetChainId: number) => {
  if (targetChainId === 4) {
    window?.ethereum
      ?.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0x4",
          },
        ],
      })
      .then(() => {});
  } else {
    window?.ethereum
      ?.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0x1",
          },
        ],
      })
      .then(() => {});
  }
};
