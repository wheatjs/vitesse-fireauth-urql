<script setup lang="ts">
import firebase from 'firebase/app'
import { useRouter } from 'vue-router'

const { push } = useRouter()
const auth = firebase.auth()

const signin = () => {
  auth
    .signInAnonymously()
    .then(() => push('/'))
}
</script>

<template>
  <div>
    <button class="btn" @click="signin">
      <carbon-locked />
      Sign In Anonymously
    </button>
  </div>
</template>
