/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export declare namespace IDelegationRegistry {
  export type ContractDelegationStruct = {
    contract_: PromiseOrValue<string>;
    delegate: PromiseOrValue<string>;
  };

  export type ContractDelegationStructOutput = [string, string] & {
    contract_: string;
    delegate: string;
  };

  export type DelegationInfoStruct = {
    type_: PromiseOrValue<BigNumberish>;
    vault: PromiseOrValue<string>;
    delegate: PromiseOrValue<string>;
    contract_: PromiseOrValue<string>;
    tokenId: PromiseOrValue<BigNumberish>;
  };

  export type DelegationInfoStructOutput = [
    number,
    string,
    string,
    string,
    BigNumber
  ] & {
    type_: number;
    vault: string;
    delegate: string;
    contract_: string;
    tokenId: BigNumber;
  };

  export type TokenDelegationStruct = {
    contract_: PromiseOrValue<string>;
    tokenId: PromiseOrValue<BigNumberish>;
    delegate: PromiseOrValue<string>;
  };

  export type TokenDelegationStructOutput = [string, BigNumber, string] & {
    contract_: string;
    tokenId: BigNumber;
    delegate: string;
  };
}

export interface IDelegationRegistryInterface extends utils.Interface {
  functions: {
    "checkDelegateForAll(address,address)": FunctionFragment;
    "checkDelegateForContract(address,address,address)": FunctionFragment;
    "checkDelegateForToken(address,address,address,uint256)": FunctionFragment;
    "delegateForAll(address,bool)": FunctionFragment;
    "delegateForContract(address,address,bool)": FunctionFragment;
    "delegateForToken(address,address,uint256,bool)": FunctionFragment;
    "getContractLevelDelegations(address)": FunctionFragment;
    "getDelegatesForAll(address)": FunctionFragment;
    "getDelegatesForContract(address,address)": FunctionFragment;
    "getDelegatesForToken(address,address,uint256)": FunctionFragment;
    "getDelegationsByDelegate(address)": FunctionFragment;
    "getTokenLevelDelegations(address)": FunctionFragment;
    "revokeAllDelegates()": FunctionFragment;
    "revokeDelegate(address)": FunctionFragment;
    "revokeSelf(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "checkDelegateForAll"
      | "checkDelegateForContract"
      | "checkDelegateForToken"
      | "delegateForAll"
      | "delegateForContract"
      | "delegateForToken"
      | "getContractLevelDelegations"
      | "getDelegatesForAll"
      | "getDelegatesForContract"
      | "getDelegatesForToken"
      | "getDelegationsByDelegate"
      | "getTokenLevelDelegations"
      | "revokeAllDelegates"
      | "revokeDelegate"
      | "revokeSelf"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "checkDelegateForAll",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "checkDelegateForContract",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "checkDelegateForToken",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "delegateForAll",
    values: [PromiseOrValue<string>, PromiseOrValue<boolean>]
  ): string;
  encodeFunctionData(
    functionFragment: "delegateForContract",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<boolean>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "delegateForToken",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<boolean>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getContractLevelDelegations",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getDelegatesForAll",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getDelegatesForContract",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getDelegatesForToken",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getDelegationsByDelegate",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getTokenLevelDelegations",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeAllDelegates",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "revokeDelegate",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeSelf",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "checkDelegateForAll",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "checkDelegateForContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "checkDelegateForToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "delegateForAll",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "delegateForContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "delegateForToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getContractLevelDelegations",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDelegatesForAll",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDelegatesForContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDelegatesForToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDelegationsByDelegate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTokenLevelDelegations",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "revokeAllDelegates",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "revokeDelegate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeSelf", data: BytesLike): Result;

  events: {
    "DelegateForAll(address,address,bool)": EventFragment;
    "DelegateForContract(address,address,address,bool)": EventFragment;
    "DelegateForToken(address,address,address,uint256,bool)": EventFragment;
    "RevokeAllDelegates(address)": EventFragment;
    "RevokeDelegate(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "DelegateForAll"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DelegateForContract"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DelegateForToken"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RevokeAllDelegates"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RevokeDelegate"): EventFragment;
}

export interface DelegateForAllEventObject {
  vault: string;
  delegate: string;
  value: boolean;
}
export type DelegateForAllEvent = TypedEvent<
  [string, string, boolean],
  DelegateForAllEventObject
>;

export type DelegateForAllEventFilter = TypedEventFilter<DelegateForAllEvent>;

export interface DelegateForContractEventObject {
  vault: string;
  delegate: string;
  contract_: string;
  value: boolean;
}
export type DelegateForContractEvent = TypedEvent<
  [string, string, string, boolean],
  DelegateForContractEventObject
>;

export type DelegateForContractEventFilter =
  TypedEventFilter<DelegateForContractEvent>;

export interface DelegateForTokenEventObject {
  vault: string;
  delegate: string;
  contract_: string;
  tokenId: BigNumber;
  value: boolean;
}
export type DelegateForTokenEvent = TypedEvent<
  [string, string, string, BigNumber, boolean],
  DelegateForTokenEventObject
>;

export type DelegateForTokenEventFilter =
  TypedEventFilter<DelegateForTokenEvent>;

export interface RevokeAllDelegatesEventObject {
  vault: string;
}
export type RevokeAllDelegatesEvent = TypedEvent<
  [string],
  RevokeAllDelegatesEventObject
>;

export type RevokeAllDelegatesEventFilter =
  TypedEventFilter<RevokeAllDelegatesEvent>;

export interface RevokeDelegateEventObject {
  vault: string;
  delegate: string;
}
export type RevokeDelegateEvent = TypedEvent<
  [string, string],
  RevokeDelegateEventObject
>;

export type RevokeDelegateEventFilter = TypedEventFilter<RevokeDelegateEvent>;

export interface IDelegationRegistry extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IDelegationRegistryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    checkDelegateForAll(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    checkDelegateForContract(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    checkDelegateForToken(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    delegateForAll(
      delegate: PromiseOrValue<string>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    delegateForContract(
      delegate: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    delegateForToken(
      delegate: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getContractLevelDelegations(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [IDelegationRegistry.ContractDelegationStructOutput[]] & {
        delegations: IDelegationRegistry.ContractDelegationStructOutput[];
      }
    >;

    getDelegatesForAll(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    getDelegatesForContract(
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    getDelegatesForToken(
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    getDelegationsByDelegate(
      delegate: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[IDelegationRegistry.DelegationInfoStructOutput[]]>;

    getTokenLevelDelegations(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [IDelegationRegistry.TokenDelegationStructOutput[]] & {
        delegations: IDelegationRegistry.TokenDelegationStructOutput[];
      }
    >;

    revokeAllDelegates(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    revokeDelegate(
      delegate: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    revokeSelf(
      vault: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  checkDelegateForAll(
    delegate: PromiseOrValue<string>,
    vault: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  checkDelegateForContract(
    delegate: PromiseOrValue<string>,
    vault: PromiseOrValue<string>,
    contract_: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  checkDelegateForToken(
    delegate: PromiseOrValue<string>,
    vault: PromiseOrValue<string>,
    contract_: PromiseOrValue<string>,
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  delegateForAll(
    delegate: PromiseOrValue<string>,
    value: PromiseOrValue<boolean>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  delegateForContract(
    delegate: PromiseOrValue<string>,
    contract_: PromiseOrValue<string>,
    value: PromiseOrValue<boolean>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  delegateForToken(
    delegate: PromiseOrValue<string>,
    contract_: PromiseOrValue<string>,
    tokenId: PromiseOrValue<BigNumberish>,
    value: PromiseOrValue<boolean>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getContractLevelDelegations(
    vault: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<IDelegationRegistry.ContractDelegationStructOutput[]>;

  getDelegatesForAll(
    vault: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string[]>;

  getDelegatesForContract(
    vault: PromiseOrValue<string>,
    contract_: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string[]>;

  getDelegatesForToken(
    vault: PromiseOrValue<string>,
    contract_: PromiseOrValue<string>,
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string[]>;

  getDelegationsByDelegate(
    delegate: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<IDelegationRegistry.DelegationInfoStructOutput[]>;

  getTokenLevelDelegations(
    vault: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<IDelegationRegistry.TokenDelegationStructOutput[]>;

  revokeAllDelegates(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  revokeDelegate(
    delegate: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  revokeSelf(
    vault: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    checkDelegateForAll(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    checkDelegateForContract(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    checkDelegateForToken(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    delegateForAll(
      delegate: PromiseOrValue<string>,
      value: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;

    delegateForContract(
      delegate: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      value: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;

    delegateForToken(
      delegate: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      value: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;

    getContractLevelDelegations(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<IDelegationRegistry.ContractDelegationStructOutput[]>;

    getDelegatesForAll(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string[]>;

    getDelegatesForContract(
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string[]>;

    getDelegatesForToken(
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string[]>;

    getDelegationsByDelegate(
      delegate: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<IDelegationRegistry.DelegationInfoStructOutput[]>;

    getTokenLevelDelegations(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<IDelegationRegistry.TokenDelegationStructOutput[]>;

    revokeAllDelegates(overrides?: CallOverrides): Promise<void>;

    revokeDelegate(
      delegate: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeSelf(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "DelegateForAll(address,address,bool)"(
      vault?: null,
      delegate?: null,
      value?: null
    ): DelegateForAllEventFilter;
    DelegateForAll(
      vault?: null,
      delegate?: null,
      value?: null
    ): DelegateForAllEventFilter;

    "DelegateForContract(address,address,address,bool)"(
      vault?: null,
      delegate?: null,
      contract_?: null,
      value?: null
    ): DelegateForContractEventFilter;
    DelegateForContract(
      vault?: null,
      delegate?: null,
      contract_?: null,
      value?: null
    ): DelegateForContractEventFilter;

    "DelegateForToken(address,address,address,uint256,bool)"(
      vault?: null,
      delegate?: null,
      contract_?: null,
      tokenId?: null,
      value?: null
    ): DelegateForTokenEventFilter;
    DelegateForToken(
      vault?: null,
      delegate?: null,
      contract_?: null,
      tokenId?: null,
      value?: null
    ): DelegateForTokenEventFilter;

    "RevokeAllDelegates(address)"(vault?: null): RevokeAllDelegatesEventFilter;
    RevokeAllDelegates(vault?: null): RevokeAllDelegatesEventFilter;

    "RevokeDelegate(address,address)"(
      vault?: null,
      delegate?: null
    ): RevokeDelegateEventFilter;
    RevokeDelegate(vault?: null, delegate?: null): RevokeDelegateEventFilter;
  };

  estimateGas: {
    checkDelegateForAll(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    checkDelegateForContract(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    checkDelegateForToken(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    delegateForAll(
      delegate: PromiseOrValue<string>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    delegateForContract(
      delegate: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    delegateForToken(
      delegate: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getContractLevelDelegations(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDelegatesForAll(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDelegatesForContract(
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDelegatesForToken(
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDelegationsByDelegate(
      delegate: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getTokenLevelDelegations(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    revokeAllDelegates(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    revokeDelegate(
      delegate: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    revokeSelf(
      vault: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    checkDelegateForAll(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    checkDelegateForContract(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    checkDelegateForToken(
      delegate: PromiseOrValue<string>,
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    delegateForAll(
      delegate: PromiseOrValue<string>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    delegateForContract(
      delegate: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    delegateForToken(
      delegate: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      value: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getContractLevelDelegations(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDelegatesForAll(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDelegatesForContract(
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDelegatesForToken(
      vault: PromiseOrValue<string>,
      contract_: PromiseOrValue<string>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDelegationsByDelegate(
      delegate: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getTokenLevelDelegations(
      vault: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    revokeAllDelegates(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    revokeDelegate(
      delegate: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    revokeSelf(
      vault: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
