import testABI from "./test.contractABI.json";
import mainABI from "./main.contractABI.json";

type Network = "test" | "main";
const configs: Record<
  Network,
  {
    chainId: number;
    contractAddress: string;
    contractABI: typeof testABI;
    etherscanUrl: string;
  }
> = {
  test: {
    chainId: 4,
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
    contractABI: testABI,
    etherscanUrl: "https://rinkeby.etherscan.io/address/",
  },
  main: {
    chainId: 1,
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
    contractABI: mainABI,
    etherscanUrl: "https://etherscan.io/address/",
  },
};

export const config =
  configs[(process.env.NEXT_PUBLIC_NETWORK_ENV as Network) || "test"];
