<template lang="pug">
  div()
    br()
    v-row()
      v-col(md="8")
        v-text-field(
          v-model="search"
          solo
          label="Search"
          clearable
          @click:clear="clearGlobalSearch()"
        )
      v-col(md="4")
        v-btn(@click="refetchData()") Search
    v-data-table(
      :loading="loading"
      :headers="headers"
      :items="items"
      item-key="id"
      dense
      :options.sync="options"
      :server-items-length="serverItemsLength"
      :footer-props="{ 'items-per-page-options': [5, 10, 20, 50], 'show-first-last-page': true, 'first-icon': 'mdi-page-first', 'last-icon': 'mdi-page-last', 'show-current-page': true }"
      multi-sort
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
    ).elevation-1.mt-10
      // CUSTOM USER CELL
      template(
        v-slot:item.user="{ item }"
      ) {{ `${item.user.last_name} ${item.user.first_name}, ${item.user.title}` }}
      // CUSTOM SALES CELL WITH CURRENCY CONVERSION
      template(
        v-slot:item.sales="{ item }"
      )
        span(v-if="currencyConverter") {{convertCurrency(item.sales, item.currency)}} Eur
        span(v-else) {{item.sales}}
          i().ml-1 ({{item.currency}})

      // CUSTOM PREPENDED ROW WITH FILTERS
      template(
        v-slot:header="{ props: { headers } }"
      )
        thead()
          tr()
            th(
              v-for="header in headers"
            ).text-left.pl-3
              v-menu(
                offset-y
                :close-on-content-click="false"
                v-model="menuOpened[header.value]"
              )
                template(
                  v-slot:activator="{ on, attrs }"
                )
                  v-icon(
                    size="18"
                    v-bind="attrs"
                    v-on="on"
                    :class="isFilterActive(header.value) ? 'orange--text' : 'grey--text'"
                  ) mdi-filter
                  span()
                    i() {{ isFilterActive(header.value) ? getFilterMessage(header.value) : '' }}
                  br()
                  v-icon(
                    v-if="header.value === 'sales'"
                    size="18"
                    @click="currencyConverter = !currencyConverter"
                  ).ml-2.grey--text {{ currencyConverter ? 'mdi-currency-eur' : 'mdi-currency-eur-off' }}
                  span() {{ isFilterActive(header.value) ? getFilterIndex(header.value) : '' }}
                v-card().pa-4
                  component(
                    :is="'Filter_' + header.value"
                    :columnName="header.value"
                    :itemsMeta="itemsMeta"
                    @new-filter="registerFilter"
                  )
</template>

<script>
import Filter_user from '@/components/filters/Filter_user.vue'
import Filter_email from '@/components/filters/Filter_email.vue'
import Filter_sales from '@/components/filters/Filter_sales.vue'
import Filter_year from '@/components/filters/Filter_year.vue'
import Filter_country from '@/components/filters/Filter_country.vue'
import Filter_gender from '@/components/filters/Filter_gender.vue'

export default {
  components: {
    Filter_user,
    Filter_email,
    Filter_sales,
    Filter_year,
    Filter_country,
    Filter_gender
  },
  props: ['headers', 'items', 'serverItemsLength', 'itemsMeta'],
  data() {
    return {
      menuOpened: {},
      loading: true,
      options: {
        page: 1,
        itemsPerPage: 10
      },
      sortBy: null,
      sortDesc: null,
      filters: {}, // custom struct, each key represents header, contains message and filter data
      search: null,
      currencyConverter: false
    }
  },
  watch: {
    options: {
      deep: true,
      handler (newValue) {
        this.refetchData()
      }
    },
    items: {
      deep: true,
      handler () {
        this.loading = false
      }
    },
    filters: {
      deep: true,
      handler () {
        this.refetchData()
      }
    }
  },
  methods: {
    isFilterActive (columnName) {
      return this.filters[columnName]
    },
    getFilterMessage (columnName) {
      return this.filters[columnName].message
    },
    getFilterIndex (columnName) {
      return Object.keys(this.filters).findIndex(x => x === columnName) + 1
    },
    convertCurrency (amount, currency) {
      return (amount * this.itemsMeta.exchangeRates[currency])?.toFixed(2) || 'Err'
    },
    clearGlobalSearch () {
      this.search = null
      this.refetchData()
    },
    registerFilter (data) {
      if (!data.columnName) {
        alert('Oooops, something went terribly wrong! (Dev: columnName not supplied)')
        return
      }
      this.menuOpened[data.columnName] = false
      if (data.reset) {
        this.$delete(this.filters, data.columnName)
      } else {
        this.$set(this.filters, data.columnName, data.filterData)
      }
    },
    refetchData () {
      this.$nextTick(() => {
        this.loading = true
        const pageIndex = this.options.page
        const pageSize = this.options.itemsPerPage
        this.$emit('fetch-handle', pageIndex, pageSize, {
          sort: {
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
          },
          filters: this.filters,
          search: this.search
        })
      })
    }
  }
}
</script>

<style lang="sass" scoped>
  .v-data-table
    max-width: 100%
</style>
