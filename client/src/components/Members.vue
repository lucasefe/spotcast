<template>
  <b-table :data="members" :columns="columns"></b-table>
</template>

<script>
export default {
  sockets: {
    MEMBERS_UPDATED: function(socket_data) {
      this.members = socket_data.members;
    }
  },
  data: () => ({
    members: [ ],
    columns: [
      {
        field: 'name',
        label: 'Name',
        width: '40'
      }
    ]
  })
}
</script>