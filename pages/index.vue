<template lang="pug">
  v-container
    v-row
      v-col(cols)
        DataTable(
          v-if="items"
          :headers="headers"
          :items="items"
          :itemsMeta="itemsMeta"
          :serverItemsLength="serverItemsLength"
          :exchangeRates="exchangeRates"
          @fetch-handle="fetchHandle"
        )
        v-progress-circular(
          v-if="!items"
          width="2"
          color="rs__primary"
          indeterminate
        ).mx-auto
        span()
</template>

<script>
import DataTable from '~/components/DataTable.vue'
import exchangeRates from '~/api/exchangeRates.js'
import filterData from '~/helpers/filter.js'

export default {
  components: {
    DataTable
  },
  data() {
    return {
      exchangeRates,
      items: [],
      itemsMeta: {},
      serverItemsLength: 0,
      // STATIC, DON'T TOUCH IT!
      // since the app uses both components and functions tied to header values,
      //    introducing new value without corresponding component, filter and sort
      //    will CRASH the application at runtime
      headers: [
        { text: 'Name', value: 'user', align: 'start' },
        { text: 'Email', value: 'email' },
        { text: 'Gender', value: 'gender' },
        { text: 'Year', value: 'year' },
        { text: 'Sales', value: 'sales' },
        { text: 'Country', value: 'country' },
      ],
      fetchData: {}
    }
  },
  async created() {
    this.fetchData = {
      page: 1,
      size: 10,
      data: {}
    }
    await this.fetch()
  },
  methods: {
    // I am super unsure about this thing, I get it only partially...
    // Why am I still getting the whole sales.js data through network on initial load??
    // Config issue? Not understanding nuxt fully yet?
    async fetch() {
      // How on Earth do I make this always run on server??
      // CONSIDER: if filters nor sortData changed, we could use some cache somehow to not run filters and expensive sort on each page
      await this.delay(500)
      const filtered = filterData(this.fetchData)
      this.items = filtered.items
      this.serverItemsLength = filtered.itemsCount
      this.itemsMeta = filtered.meta
    },
    async fetchHandle (page, size, data) {
      this.fetchData = {page, size, data}
      await this.fetch()
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
  }
}
</script>

<style lang="sass" scoped>
.v-progress-circular
  position: absolute
  top: 50%
  left: 50%
</style>