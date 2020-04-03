<template>
    <div class="container">
      <Profile></Profile>
      <CurrentlyPlaying></CurrentlyPlaying>
    </div>
</template>

<script>

import CurrentlyPlaying from "./components/CurrentlyPlaying.vue"
import Profile from "./components/Profile.vue"

export default {
  name: 'App',
  components: {
    CurrentlyPlaying,
    Profile
  },

  data: () => ({

  }),
};
</script>
