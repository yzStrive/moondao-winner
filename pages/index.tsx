/* eslint-disable react/no-unescaped-entities */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Contract, ethers, BigNumber } from "ethers";
import Head from "next/head";
import Image from "next/image";
import useMedia from "use-media";
import numeral from "numeral";
import classNames from "classnames";
import styles from "../styles/Home.module.css";
import Modal from "react-modal";
import GNumber from "../components/g-number/index";
import { config } from "../config";
import { switchNetwork } from "../utils";
import range from "lodash/range";
declare const window: any;

const formatAddress = (address: string, subLength?: number) => {
  if (!address || address.length < 20 || subLength === address?.length) {
    return address;
  }
  const length = address.length;
  return `${address.slice(
    0,
    Math.min(subLength || 5, length)
  )}...${address.slice(length - Math.min(subLength || 5, length), length)}`;
};

const gasOptions = (gas: BigNumber) => {
  const multiplied = Math.floor(gas.toNumber() * 2);
  return BigNumber.from(multiplied);
};

Modal.setAppElement("#__next");

type WinnerType = {
  index: number;
  winner: number;
};
export default function Home() {
  const isMobile = useMedia({ maxWidth: "1024px" });
  const [address, setAddress] = useState("");
  const [visible, setVisible] = useState(false);
  const [winnerList, setWinnerList] = useState<Array<WinnerType>>([]);
  const [counter, setCounter] = useState(0);
  const counterRef = useRef();
  const [isPicking, setIsPicking] = useState(false);
  const [pickResult, setPickResult] = useState<
    | {
        index: number;
        winner: number;
      }
    | undefined
  >();
  const syncedWinnerListRef = useRef();
  const [syncedWinnerCounter, setSyncedWinnerCounter] = useState(0);

  const connectWallet = useCallback(async () => {
    try {
      if (window.ethereum) {
        const { chainId } = window.ethereum;
        if (Number(chainId) !== config.chainId) {
          await switchNetwork(config.chainId);
        }
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAddress(address);
        return provider;
      }
    } catch (e) {
      console.error(e);
    }
  }, []);
  const getMoonDAOWinnerContract = useCallback(async () => {
    const provider = await connectWallet();
    const signer = provider?.getSigner();
    const MoonDAOWinnerContract = new Contract(
      config.contractAddress,
      config.contractABI,
      signer
    );
    return MoonDAOWinnerContract;
  }, [connectWallet]);
  const getNoRequestContract = useCallback(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      return new Contract(config.contractAddress, config.contractABI, provider);
    }
  }, []);
  const fetchWinnerList = useCallback(
    async (counter: number) => {
      try {
        const MoonDAOWinnerContract = await getNoRequestContract();
        const winners: any[] = [];
        await Promise.all(
          range(counter).map(async (item) => {
            const rolledNum = await MoonDAOWinnerContract?.diceList(item);
            if (rolledNum > 0) {
              const winner = await MoonDAOWinnerContract?.reMapping(rolledNum);
              if (winner) {
                winners.push({
                  index: 10 - item - 1,
                  winner: winner,
                });
              }
            }
          })
        );
        setWinnerList(winners);
        return winners;
      } catch (e) {
        console.error(e);
      }
    },
    [getNoRequestContract]
  );
  const validWinnerList = useMemo(() => {
    const arrays = winnerList.filter((item) => item.winner > 0);
    arrays.sort((a, b) => b.index - a.index);
    return arrays;
  }, [winnerList]);
  const fetchRollCounter = useCallback(async () => {
    const MoonDAOWinnerContract = await getNoRequestContract();
    const counter = await MoonDAOWinnerContract?.roll_Counter();
    setCounter(counter.toNumber());
    return counter.toNumber();
  }, [getNoRequestContract]);
  const fetchSyncedWinnerList = useCallback(
    async (counter: number) => {
      try {
        const MoonDAOWinnerContract = await getNoRequestContract();
        const winners: Array<WinnerType> = [];
        await Promise.all(
          range(counter).map(async (item) => {
            const winner = await MoonDAOWinnerContract?.winnerNFTList(item);
            if (winner > 0) {
              winners.push({
                index: 10 - item - 1,
                winner,
              });
            }
          })
        );
        const lens = winners.filter((item) => item.winner > 0).length;
        if (lens > 0) {
          setSyncedWinnerCounter(lens);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [getNoRequestContract]
  );
  const RollTheDice = useCallback(async () => {
    if (isPicking) {
      return;
    }
    try {
      const MoonDAOWinnerContract = await getMoonDAOWinnerContract();
      const gas = await MoonDAOWinnerContract.estimateGas.RollTheDice();
      await MoonDAOWinnerContract.RollTheDice({
        gasLimit: gasOptions(gas),
      });
      setVisible(true);
    } catch (e) {
      setIsPicking(false);
    }
  }, [getMoonDAOWinnerContract, isPicking]);

  const syncResultToWinnerList = useCallback(async () => {
    try {
      const MoonDAOWinnerContract = await getMoonDAOWinnerContract();
      const gas = await MoonDAOWinnerContract.estimateGas.reMappingAList();
      await MoonDAOWinnerContract.reMappingAList({
        gasLimit: gasOptions(gas),
      });
    } catch (e) {
      console.error(e);
    }
  }, [getMoonDAOWinnerContract]);

  useEffect(() => {
    const syncCounter = async () => {
      counterRef.current = window.setInterval(async () => {
        const latestCounter = await fetchRollCounter();
        const winners = await fetchWinnerList(latestCounter);
        if (
          latestCounter !== winners?.filter((item) => item.winner > 0).length
        ) {
          setIsPicking(true);
          fetchWinnerList(latestCounter);
        }
      }, 500);
    };
    const syncWinnerListCounter = async () => {
      syncedWinnerListRef.current = window.setInterval(async () => {
        fetchSyncedWinnerList(counter);
      }, 500);
    };
    syncWinnerListCounter();
    syncCounter();
    return () => {
      clearInterval(counterRef.current);
    };
  }, [
    counter,
    fetchRollCounter,
    fetchSyncedWinnerList,
    fetchWinnerList,
    validWinnerList.length,
  ]);
  useEffect(() => {
    if (isPicking && validWinnerList.length === counter) {
      setIsPicking(false);
      setPickResult(validWinnerList[validWinnerList.length - 1]);
    }
  }, [counter, isPicking, validWinnerList, validWinnerList.length]);

  useEffect(() => {
    const init = async () => {
      const originCounter = await fetchRollCounter();
      if (counter === 0 && originCounter) {
        fetchWinnerList(originCounter);
      }
    };
    init();
  }, [counter, fetchRollCounter, fetchWinnerList]);

  return (
    <div className={styles.page}>
      <Head>
        <title>MoonDAO Winner</title>
        <link rel="icon" href="/assets/img/fav.png" />
      </Head>
      <video
        id="bgVideo"
        poster="/assets/img/poster-pc.jpg"
        className={styles.video}
        autoPlay
        muted
        loop
      >
        <source src={`assets/video/pc.webm`} type="video/mp4" />
      </video>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Image src="/assets/img/logo.png" alt="Logo" layout="fill" />
          </div>
          <div className={styles.wallet} onClick={connectWallet}>
            <div className={styles.metamask}>
              <Image src="/assets/img/metamask.png" alt="Logo" layout="fill" />
            </div>
            {address ? (
              <span className={styles.address}>{formatAddress(address)}</span>
            ) : (
              <span className={styles.connectWallet}>Connect Wallet</span>
            )}
          </div>
        </div>
        <main className={styles.main}>
          <div className={styles.left}>
            <div className={styles.leftWrapper}>
              {validWinnerList.length >= 10 ? (
                <>
                  <span className={styles.congratulations}>
                    Congratulations 🎉🎉🎉
                  </span>
                  {syncedWinnerCounter !== counter && (
                    <span
                      className={styles.syncBtn}
                      onClick={() => {
                        syncResultToWinnerList();
                      }}
                    >
                      Sync WinnerList Result on Chain
                    </span>
                  )}
                </>
              ) : (
                <div
                  className={styles.pickBtn}
                  onClick={RollTheDice}
                  style={
                    isPicking
                      ? {
                          cursor: "not-allowed",
                        }
                      : {}
                  }
                >
                  <span className={styles.pickText}>PICK ASTRONAUT</span>
                  <Image src="/assets/img/btn.png" alt="Logo" layout="fill" />
                </div>
              )}
              <div className={styles.astronautListWrapper}>
                {validWinnerList.map((item, index) => {
                  return (
                    <div className={styles.astronautItem} key={index}>
                      <div className={styles.astronautIcon}>
                        <Image
                          src="/assets/img/astronaut-icon.png"
                          alt="Logo"
                          layout="fill"
                        />
                      </div>
                      <span className={styles.astronautNumber}>
                        No{item.index + 1} #{item.winner}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {!isMobile && (
            <div className={styles.right}>
              <div className={styles.rightImages}>
                <div className={styles.earth}>
                  <Image src="/assets/img/earth.png" alt="Logo" layout="fill" />
                </div>
                <video
                  id="astronautVideo"
                  className={styles.astronaut}
                  autoPlay
                  muted
                  loop
                >
                  <source
                    src={`assets/video/walking2.webm`}
                    type="video/webm"
                  />
                </video>
              </div>
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={visible}
        shouldCloseOnEsc
        style={{
          content: {
            position: "relative",
            zIndex: 10000,
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            width: "70vw",
            overflow: "hidden",
          },
        }}
      >
        <GNumber
          onClose={() => {
            setPickResult(undefined);
            setVisible(false);
          }}
          pickResult={pickResult}
        />
      </Modal>

      <footer className={styles.footer}>Copyright © 2022 MoonDAO.</footer>
    </div>
  );
}
