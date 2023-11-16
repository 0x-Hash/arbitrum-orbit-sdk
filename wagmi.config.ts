import { etherscan } from '@wagmi/cli/plugins';

import { ParentChainId } from './src';
import { arbitrumOne, arbitrumGoerli, arbitrumSepolia } from './src/chains';

const blockExplorerApiUrls: Record<ParentChainId, string> = {
  [arbitrumOne.id]: 'https://api.arbiscan.io/api',
  [arbitrumGoerli.id]: 'https://api-goerli.arbiscan.io/api',
  [arbitrumSepolia.id]: 'https://api-sepolia.arbiscan.io/api',
};

export async function fetchAbi(chainId: ParentChainId, address: `0x${string}`) {
  await (
    await fetch(
      `${blockExplorerApiUrls[chainId]}?module=contract&action=getabi&format=raw&address=${address}&apikey=${process.env.ARBISCAN_API_KEY}`
    )
  ).json();
}

type ContractConfig = {
  name: string;
  address: Record<ParentChainId, `0x${string}`>;
};

const contracts: ContractConfig[] = [
  {
    name: 'RollupCreator',
    address: {
      [arbitrumOne.id]: '0x9CAd81628aB7D8e239F1A5B497313341578c5F71',
      [arbitrumGoerli.id]: '0x2025FCb2Ee63Fcd60E079c9602f7a25bfcA100EE',
      [arbitrumSepolia.id]: '0x06E341073b2749e0Bb9912461351f716DeCDa9b0',
    },
  },
];

function allEqual<T>(array: T[]) {
  return array.every((value) => value === array[0]);
}

export async function assertContractAbisMatch(contract: ContractConfig) {
  const abis = await Promise.all(
    Object.entries(contract.address)
      // fetch abis for all chains
      .map(([chainId, address]) =>
        fetchAbi(Number(chainId) as ParentChainId, address)
      )
  );

  // make sure all abis are the same
  if (!allEqual(abis.map((abi) => JSON.stringify(abi)))) {
    throw new Error(`- ${contract.name} ERROR`);
  }

  console.log(`- ${contract.name} ✔`);
}

export default async function () {
  console.log(`Checking if contract ABIs match...`);

  for (const contract of contracts) {
    await assertContractAbisMatch(contract);
  }

  return {
    out: 'src/generated.ts',
    plugins: [
      etherscan({
        chainId: arbitrumOne.id,
        apiKey: process.env.ARBISCAN_API_KEY!,
        contracts,
        cacheDuration: 0,
      }),
    ],
  };
}
