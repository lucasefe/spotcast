<template>
    <div class="container">
      <a href="/login">Login</a>
      <CurrentlyPlaying/>
    </div>
</template>

<script>

import CurrentlyPlaying from "./components/CurrentlyPlaying.vue"

export default {
  name: 'App',

  components: {
    CurrentlyPlaying
  },

  data: () => ({
    //
  }),
};
</script>
