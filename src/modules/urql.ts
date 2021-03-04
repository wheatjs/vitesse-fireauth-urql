import { when } from '@vueuse/core'

import 'firebase/auth'
import { useAuth } from '@vueuse/firebase'

import urql, { ClientOptions } from '@urql/vue'
import { makeOperation, dedupExchange, cacheExchange, fetchExchange } from '@urql/core'
import { authExchange } from '@urql/exchange-auth'

import { isFirebaseInit } from './firebase'
import { UserModule } from '~/types'

const { VITE_GRAPHQL_URL } = import.meta.env

function addAuthExchange() {
  return authExchange({
    async getAuth() {
      await when(isFirebaseInit).toBeTruthy({ timeout: 500 })

      if (!isFirebaseInit.value)
        return null

      const { isAuthenticated, user } = useAuth()

      if (!isAuthenticated.value)
        return null

      return await user.value?.getIdToken()
    },
    addAuthToOperation({ operation, authState }) {
      if (!authState)
        return operation

      const fetchOptions = typeof operation.context.fetchOptions === 'function' ? operation.context.fetchOptions() : operation.context.fetchOptions || {}

      return makeOperation(operation.kind, operation, {
        ...operation.context,
        fetchOptions: {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            Authorization: `Bearer ${authState}`,
          },
        },
      })
    },
  })
}

export const install: UserModule = ({ app, isClient }) => {
  if (!isClient)
    return

  app.use(urql, {
    url: VITE_GRAPHQL_URL,
    exchanges: [
      dedupExchange,
      cacheExchange,
      addAuthExchange(),
      fetchExchange,
    ],
  } as ClientOptions)
}
