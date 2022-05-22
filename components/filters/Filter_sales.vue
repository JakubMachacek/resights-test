<template lang="pug">
  div()
    h3() Filter emails
    br()
    v-row()
      v-col(md="6")
        v-btn(small @click="applyFilter()") Apply
      v-col(md="6")
        v-btn(small @click="resetFilter()") Reset
    v-row()
      v-col(md="6")
        v-text-field(
          label="From"
          v-model.number="rangeFrom"
          :rules="[numberRule]"
          append-icon="mdi-currency-eur"
        ).full-width
      v-col(md="6")
        v-text-field(
          label="To"
          v-model.number="rangeTo"
          :rules="[numberRule]"
          append-icon="mdi-currency-eur"
        ).full-width
    v-select(
      multiple
      label="Filter by currency"
      v-model="selectedCurrencies"
      :items="currencies"
    )
      template(v-slot:prepend-item)
        v-list-item(
          ripple
          @mousedown.prevent
          @click="toggleAll"
        )
          v-list-item-action()
            v-icon(
              :color="selectedCurrencies.length > 0 ? 'indigo darken-4' : ''"
            ) {{ icon }}
          v-list-item-action()
            v-list-item-title() Select all
        v-divider().mt-0
</template>

<script>
export default {
  props: [ 'columnName', 'itemsMeta' ],
  data() {
    return {
      rangeFrom: '',
      rangeTo: '',
      currencies: [],
      selectedCurrencies: [],
      numberRule: v  => {
        if (!isNaN(parseFloat(v)) && v >= 0) return true
        return 'This is not a non-negative number.'
      }
    }
  },
  computed: {
    // Full disclosure: these three functions are stolen from Vuetify docs for v-select
    // Don't reinvent the wheel :)
    selectedAllProviders () {
      return this.selectedCurrencies.length === this.currencies.length
    },
    selectedSomeProviders () {
      return this.selectedCurrencies.length > 0 && !this.selectedAllProviders
    },
    icon () {
      if (this.selectedAllProviders) return 'mdi-close-box'
      if (this.selectedSomeProviders) return 'mdi-minus-box'
      return 'mdi-checkbox-blank-outline'
    },
    // NEEDED ON EACH FILTeR COMPONENT
    // this is my way of communicating filter settings in simple way back to datatable
    // each component will have custom implementation
    getMessage () {
      let keywordPart = ''
      let currencyPart = 0
      if (this.rangeFrom) {
        keywordPart += `From ${this.rangeFrom}`
      }
      if (this.rangeTo) {
        keywordPart += `${this.rangeFrom ? ' to' : 'To'} ${this.rangeTo}`
      }
      if (this.selectedCurrencies.length !== this.currencies.length) {
        currencyPart = this.selectedCurrencies.length
      }
      if (keywordPart && currencyPart > 0) {
        return keywordPart + ` (+${currencyPart} currencies)`
      } else if (keywordPart) {
        return keywordPart
      } else if (currencyPart > 0) {
        return `${currencyPart} currencies`
      }
    },
    // this creates nicer user logic
    // if upon "apply" we see no search and either all or no checkboxes, we should reset instead
    resetOverride () {
      let sameValues = null
      if (this.selectedCurrencies.length === this.currencies.length ||
        this.selectedCurrencies.length === 0) {
        sameValues = true
      } else {
        sameValues = false
      }
      if (!this.rangeFrom && !this.rangeTo && sameValues) {
        return true
      }
      return false
    }
  },
  methods: {
    toggleAll () {
      this.$nextTick(() => {
        if (this.selectedAllProviders) {
          this.$set(this, 'selectedCurrencies', [])
        } else {
          this.$set(this, 'selectedCurrencies', this.currencies.slice())
        }
      })
    },
    applyFilter () {
      if (this.resetOverride) {
        this.resetFilter()
      } else {
        // a way to communicate filter change back to data table
        // format differs slightly depending on component
        this.$emit('new-filter', {
          columnName: this.columnName,
          filterData: {
            message: this.getMessage,
            range: {
              from: this.rangeFrom,
              to: this.rangeTo,
            },
            selectedCategories: this.selectedCurrencies
          }
        })
      }
    },
    resetFilter () {
      this.resetSelectedCurrencies()
      this.rangeFrom = ''
      this.rangeTo = ''
      // a way to communicate to datatable that filter got removed
      // same for all filter components
      this.$emit('new-filter', { columnName: this.columnName, reset: true})
    },
    resetSelectedCurrencies () {
      this.$set(this, 'selectedCurrencies', [])
    }
  },
  mounted () {
    this.currencies = this.itemsMeta.currencies
  }
}
</script>

<style lang="sass" scoped>
  .full-width
    width: 100%
</style>
