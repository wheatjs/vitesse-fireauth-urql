import type { ClientOptions } from '@urql/vue'
import firebase from 'firebase/app'
import { makeOperation, dedupExchange, cacheExchange, fetchExchange } from '@urql/core'
import { authExchange } from '@urql/exchange-auth'

import 'firebase/auth'
import urql from '@urql/vue'
import { useAuth } from '@vueuse/firebase'
import { watch } from 'vue'
import { UserModule } from '~/types'

const { VITE_GRAPHQL_URL } = import.meta.env

function addAuthExchange(user: any) {
  return authExchange({
    getAuth() {
      return new Promise<string>((resolve) => {
        if (user.value) { user.value.getIdToken().then((token: string) => resolve(token)) }
        else {
          const stop = watch(user, () => {
            if (user.value) {
              user.value.getIdToken().then((token: string) => resolve(token))
              stop()
            }
          })
        }
      })
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
  if (isClient) {
    let init = false

    firebase
      .auth()
      .onAuthStateChanged(() => {
        if (!init) {
          init = true
          const { user } = useAuth()

          app.use(urql, {
            url: VITE_GRAPHQL_URL,
            exchanges: [
              dedupExchange,
              cacheExchange,
              addAuthExchange(user),
              fetchExchange,
            ],
          } as ClientOptions)
        }
      })
  }
}
