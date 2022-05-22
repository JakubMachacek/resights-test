<template lang="pug">
  div()
    h3() Filter countries
    br()
    v-row()
      v-col(md="6")
        v-btn(small @click="applyFilter()") Apply
      v-col(md="6")
        v-btn(small @click="resetFilter()") Reset
    v-text-field(
      label="Keyword"
      v-model="searchText"
    ).full-width
    v-select(
      multiple
      label="Filter countries"
      v-model="selectedCountries"
      :items="countries"
    )
      template(v-slot:prepend-item)
        v-list-item(
          ripple
          @mousedown.prevent
          @click="toggleAll"
        )
          v-list-item-action()
            v-icon(
              :color="selectedCountries.length > 0 ? 'indigo darken-4' : ''"
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
      searchText: '',
      countries: [],
      selectedCountries: []
    }
  },
  computed: {
    // Full disclosure: these three functions are stolen from Vuetify docs for v-select
    // Don't reinvent the wheel :)
    selectedAllCountries () {
      return this.selectedCountries.length === this.countries.length
    },
    selectedSomeCountries () {
      return this.selectedCountries.length > 0 && !this.selectedAllCountries
    },
    icon () {
      if (this.selectedAllCountries) return 'mdi-close-box'
      if (this.selectedSomeCountries) return 'mdi-minus-box'
      return 'mdi-checkbox-blank-outline'
    },
    // NEEDED ON EACH FILTeR COMPONENT
    // this is my way of communicating filter settings in simple way back to datatable
    // each component will have custom implementation
    getMessage () {
      let keywordPart = ''
      let countryPart = 0
      if (this.searchText) {
        keywordPart = this.searchText
      }
      if (this.selectedCountries.length !== this.countries.length) {
        countryPart = this.selectedCountries.length
      }
      if (keywordPart && countryPart > 0) {
        return keywordPart + ` (+${countryPart} countries)`
      } else if (keywordPart) {
        return keywordPart
      } else if (countryPart > 0) {
        return `${countryPart} countries`
      }
    },
    // this creates nicer user logic
    // if upon "apply" we see no search and either all or no checkboxes, we should reset instead
    resetOverride () {
      let sameValues = null
      if (this.selectedCountries.length === this.countries.length ||
        this.selectedCountries.length === 0) {
        sameValues = true
      } else {
        sameValues = false
      }
      if (!this.searchText && sameValues) {
        return true
      }
      return false
    }
  },
  methods: {
    toggleAll () {
      this.$nextTick(() => {
        if (this.selectedAllCountries) {
          this.$set(this, 'selectedCountries', [])
        } else {
          this.$set(this, 'selectedCountries', this.countries.slice())
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
            searchKeyword: this.searchText,
            selectedCategories: this.selectedCountries
          }
        })
      }
    },
    resetFilter () {
      this.resetSelectedCountries()
      this.searchText = ''
      // a way to communicate to datatable that filter got removed
      // same for all filter components
      this.$emit('new-filter', { columnName: this.columnName, reset: true})
    },
    resetSelectedCountries () {
      this.$set(this, 'selectedCountries', [])
    }
  },
  mounted () {
    this.countries = this.itemsMeta.countries
  }
}
</script>

<style lang="sass" scoped>
  .full-width
    width: 100%
</style>
