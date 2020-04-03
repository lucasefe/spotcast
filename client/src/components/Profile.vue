<template>
  <div v-if="username">
    <p>{{name }} ({{username }})</p>
  </div>
  <div v-else>
    <a href="/login">Login</a>
  </div>
</template>

<script>
export default {
  sockets: {
    PROFILE_UPDATED: function({ profile}) {
      this.username = profile.username
      this.name = profile.name
    }
  },
  data: () => ({
    username: '',
    name: ''
  })
}
</script>
