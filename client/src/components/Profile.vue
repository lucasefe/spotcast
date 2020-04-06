<template>
  <div v-if="username">
    Logged in as {{name}} ({{username}})
  </div>
  <div v-else>
    <a href="/login">Login with Spotify</a>
  </div>
</template>

<script>
export default {
  sockets: {
    PROFILE_UPDATED: function({ profile }) {
      this.username = profile.username
      this.name = profile.name
      this.room = profile.room
    }
  },
  data: () => ({
    username: '',
    name: '',
    room: ''
  })
}
</script>
