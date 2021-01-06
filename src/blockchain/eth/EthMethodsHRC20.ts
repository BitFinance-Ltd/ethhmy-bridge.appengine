import BN from 'bn.js';
import { EthMethodsBase } from './EthMethodsBase';
import { encodeMintTokenHrc20 } from './eth-encoders';
import erc20Json = require('../contracts/MyERC20.json');
import { TransactionReceipt } from 'web3-core';
import { sleep } from '../utils';

export class EthMethodsHRC20 extends EthMethodsBase {
  getMappingFor = async hrc20TokenAddr => {
    const res = await this.ethManager.contract.methods.mappings(hrc20TokenAddr).call();

    return res;
  };

  addToken = async (hrc20TokenAddr, name, symbol, decimals) => {
    const res = await this.ethManager.contract.methods
      .addToken(process.env.ETH_TOKEN_MANAGER_CONTRACT, hrc20TokenAddr, name, symbol, decimals)
      .send({
        from: this.ethManager.account.address,
        gas: process.env.ETH_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
      });

    return res;
  };

  mintERC20Token = async (oneTokenAddr, userAddr, amount, receiptId) => {
    // console.log('before MultiSig mintToken: ', receiptId);

    const data = encodeMintTokenHrc20(oneTokenAddr, amount, userAddr, receiptId);
    return await this.submitTxEth(data);
  };

  totalSupply = async erc20Address => {
    let ethTokenContract, res;

    try {
      ethTokenContract = new this.web3.eth.Contract(erc20Json.abi as any, erc20Address);
    } catch (e) {
      await sleep(5000);

      return 0;
    }

    try {
      res = await ethTokenContract.methods.totalSupply().call();
    } catch (e) {
      await sleep(5000);

      return 0;
    }

    return res;
  };

  decodeBurnTokenLog = (receipt: TransactionReceipt) => {
    return this.web3.eth.abi.decodeLog(
      [
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'recipient',
          type: 'address',
        },
      ],
      receipt.logs[1].data,
      receipt.logs[1].topics.slice(1)
    );
  };
}
