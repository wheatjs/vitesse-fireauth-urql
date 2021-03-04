import firebase from 'firebase/app'
import 'firebase/auth'
import { ref } from 'vue'
import { when } from '@vueuse/core'
import { useAuth } from '@vueuse/firebase'
import { UserModule } from '~/types'

const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_MEASUREMENT_ID,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
} = import.meta.env

export const isFirebaseInit = ref(false)

export const install: UserModule = ({ router, isClient }) => {
  if (!isClient)
    return

  if (firebase.apps.length === 0) {
    firebase.initializeApp({
      apiKey: VITE_FIREBASE_API_KEY,
      authDomain: VITE_FIREBASE_AUTH_DOMAIN,
      projectId: VITE_FIREBASE_PROJECT_ID,
      storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: VITE_FIREBASE_APP_ID,
      measurementId: VITE_FIREBASE_MEASUREMENT_ID,
    }).auth().onAuthStateChanged(_ => isFirebaseInit.value = true)
  }
  /**
   * Router Hooks
   */
  router.beforeEach(async(to) => {
    await when(isFirebaseInit).toBeTruthy()
    const { isAuthenticated } = useAuth()

    if (to.name === 'auth-signin' && isAuthenticated.value)
      return '/'

    if (to.meta.authenticate && to.name !== 'auth-signin' && !isAuthenticated.value)
      return { name: 'auth-signin' }
  })
}
