import { Account, Accounts, Settings, SettingsFn } from '@/interfaces/settings'
import { Store } from 'tauri-plugin-store-api'

const KEY_ACCOUNTS = 'accounts'
const KEY_SELECTED_ACCOUNT = 'selectedAccount'
const ERR_ACCOUNT_EXISTED = '账号已存在！'
const ERR_ACCOUNT_NOT_FOUND = '账号未存在！'

export class SettingsStore implements SettingsFn {
  private readonly store = new Store('settings.json')

  private async getAccounts (): Promise<Accounts | null> {
    return await this.store.get<Accounts>(KEY_ACCOUNTS)
  }

  private async setAccounts (accounts: Accounts | null) {
    await this.store.set(KEY_ACCOUNTS, accounts)
  }

  private async getSelectedAccount (): Promise<number | null> {
    return await this.store.get<number>(KEY_SELECTED_ACCOUNT)
  }

  private async setSelectedAccount (uid: number | null) {
    await this.store.set(KEY_SELECTED_ACCOUNT, uid)
  }

  async loadSettings (): Promise<Settings> {
    const accounts = await this.getAccounts() || {}
    const selectedAccount = await this.getSelectedAccount()
    return {
      accounts,
      selectedAccount: selectedAccount
        ? accounts[selectedAccount]
        : null
    }
  }

  async addAccount (account: Account): Promise<Accounts> {
    const accounts = await this.getAccounts()
    if (accounts && accounts[account.uid]) {
      throw new Error(ERR_ACCOUNT_EXISTED)
    }

    const newAccounts = Object.assign(accounts || {}, { [account.uid]: account })
    await this.setAccounts(newAccounts)
    await this.setSelectedAccount(account.uid)
    return newAccounts
  }

  async removeAccount (uid: number): Promise<[Accounts, Account]> {
    const accounts = await this.getAccounts()
    if (!accounts || !accounts[uid]) {
      throw new Error(ERR_ACCOUNT_NOT_FOUND)
    }

    const selectedAccount = await this.getSelectedAccount()
    const { [uid]: removed, ...rest } = accounts

    await this.setAccounts(rest)
    if (selectedAccount === removed.uid) {
      await this.setSelectedAccount(null)
    }

    return [
      rest,
      removed
    ]
  }

  async updateAccount (uid: number, updated: Omit<Account, 'uid'>): Promise<Accounts> {
    throw new Error('TODO')
  }

  async selectAccount (uid: number): Promise<Account | null> {
    const accounts = await this.getAccounts()
    const selectedAccount = await this.getSelectedAccount()
    const newSelected = accounts?.[uid]

    if (newSelected && newSelected.uid !== selectedAccount) {
      await this.setSelectedAccount(newSelected.uid)
      return newSelected
    } else {
      return null
    }
  }
}
