<template>
    <div class="container">
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
