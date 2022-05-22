<template lang="pug">
  div()
    h3() Filter emails
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
      label="Filter titles"
      v-model="selectedEmailProviders"
      :items="emailProviders"
    )
      template(v-slot:prepend-item)
        v-list-item(
          ripple
          @mousedown.prevent
          @click="toggleAll"
        )
          v-list-item-action()
            v-icon(
              :color="selectedEmailProviders.length > 0 ? 'indigo darken-4' : ''"
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
      emailProviders: [],
      selectedEmailProviders: []
    }
  },
  computed: {
    // Full disclosure: these three functions are stolen from Vuetify docs for v-select
    // Don't reinvent the wheel :)
    selectedAllProviders () {
      return this.selectedEmailProviders.length === this.emailProviders.length
    },
    selectedSomeProviders () {
      return this.selectedEmailProviders.length > 0 && !this.selectedAllProviders
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
      let providerPart = 0
      if (this.searchText) {
        keywordPart = this.searchText
      }
      if (this.selectedEmailProviders.length !== this.emailProviders.length) {
        providerPart = this.selectedEmailProviders.length
      }
      if (keywordPart && providerPart > 0) {
        return keywordPart + ` (+${providerPart} providers)`
      } else if (keywordPart) {
        return keywordPart
      } else if (providerPart > 0) {
        return `${providerPart} providers`
      }
    },
    // this creates nicer user logic
    // if upon "apply" we see no search and either all or no checkboxes, we should reset instead
    resetOverride () {
      let sameValues = null
      if (this.selectedEmailProviders.length === this.emailProviders.length ||
        this.selectedEmailProviders.length === 0) {
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
        if (this.selectedAllProviders) {
          this.$set(this, 'selectedEmailProviders', [])
        } else {
          this.$set(this, 'selectedEmailProviders', this.emailProviders.slice())
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
            selectedCategories: this.selectedEmailProviders
          }
        })
      }
    },
    resetFilter () {
      this.resetSelectedEmailProviders()
      this.searchText = ''
      // a way to communicate to datatable that filter got removed
      // same for all filter components
      this.$emit('new-filter', { columnName: this.columnName, reset: true})
    },
    resetSelectedEmailProviders () {
      this.$set(this, 'selectedEmailProviders', [])
    }
  },
  mounted () {
    this.emailProviders = this.itemsMeta.emails
  }
}
</script>

<style lang="sass" scoped>
  .full-width
    width: 100%
</style>
