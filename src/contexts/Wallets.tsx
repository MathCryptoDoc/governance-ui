import React, {
  useMemo,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { WalletAggregator, BaseWallet } from '@polkadot-onboard/core';
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets';
import {
  PolkadotWalletsContextProvider,
  useWallets as _useWallets,
} from '@polkadot-onboard/react';

const APP_NAME = 'Swipe to Vote';
export type WalletState = 'connected' | 'disconnected';
export const useWallets = () => useContext(WalletContext);

const WalletContext = createContext({});

/**
 * Provides a local storage utility class to store the connection state of each wallet.
 * WalletState can be :'connected' | 'disconnected'
 * the state is stored in localStorage under `wallet#<walletTitle>`
 * e.g. 'wallet#polkadot-js' is the key for polkadot-js extension wallet
 */
export class WalletStateStorage {
  static getStateStorageKey(walletTitle: string) {
    return `wallet#${walletTitle}`;
  }
  static set(walletTitle: string, state: WalletState) {
    let sKey = this.getStateStorageKey(walletTitle);
    localStorage.setItem(sKey, state);
  }
  static get(walletTitle: string) {
    let sKey = this.getStateStorageKey(walletTitle);
    return localStorage.getItem(sKey);
  }
}

const WalletProviderInner = ({ children }: { children: React.ReactNode }) => {
  let { wallets } = _useWallets();
  let [walletState, _setWalletState] = useState<Record<string, WalletState>>(
    {}
  );
  const setWalletState = (title: string, state: WalletState) => {
    _setWalletState({ ...walletState, [title]: state });
    WalletStateStorage.set(title, state);
  };

  const initiateWallets = async (wallets) => {
    let walletState: Record<string, WalletState> = {};
    for (let wallet of wallets) {
      let title = wallet.metadata?.title;
      if (title) {
        let state = WalletStateStorage.get(title);
        if (state === 'connected') {
          await wallet.connect();
          walletState[title] = 'connected';
        }
      }
    }
    _setWalletState(walletState);
  };

  useEffect(() => {
    initiateWallets(wallets);
  }, [wallets]);
  return (
    <WalletContext.Provider value={{ wallets, walletState, setWalletState }}>
      {children}
    </WalletContext.Provider>
  );
};

const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  let walletAggregator = new WalletAggregator([
    new InjectedWalletProvider({}, APP_NAME),
  ]);
  return (
    <PolkadotWalletsContextProvider walletAggregator={walletAggregator}>
      <WalletProviderInner>{children}</WalletProviderInner>
    </PolkadotWalletsContextProvider>
  );
};

export default WalletProvider;
