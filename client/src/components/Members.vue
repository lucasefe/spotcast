<template>
  <b-table :data="list" :columns="columns"></b-table>
</template>

<script>
export default {
  props: [ 'list' ],
  data: () => ({
    columns: [
      {
        field: 'name',
        label: '',
        width: '40'
      }
    ]
  })
}
</script>