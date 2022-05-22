<template lang="pug">
  div()
    h3() Filter users
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
      v-model="selectedTitles"
      :items="titles"
    )
      template(v-slot:prepend-item)
        v-list-item(
          ripple
          @mousedown.prevent
          @click="toggleAll"
        )
          v-list-item-action()
            v-icon(
              :color="selectedTitles.length > 0 ? 'indigo darken-4' : ''"
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
      titles: [],
      selectedTitles: []
    }
  },
  computed: {
    // Full disclosure: these three functions are stolen from Vuetify docs for v-select
    // Don't reinvent the wheel :)
    selectedAllTitles () {
      return this.selectedTitles.length === this.titles.length
    },
    selectedSomeTitles () {
      return this.selectedTitles.length > 0 && !this.selectedAllTitles
    },
    icon () {
      if (this.selectedAllTitles) return 'mdi-close-box'
      if (this.selectedSomeTitles) return 'mdi-minus-box'
      return 'mdi-checkbox-blank-outline'
    },
    // NEEDED ON EACH FILTeR COMPONENT
    // this is my way of communicating filter settings in simple way back to datatable
    // each component will have custom implementation
    getMessage () {
      let keywordPart = ''
      let titlePart = 0
      if (this.searchText) {
        keywordPart = this.searchText
      }
      if (this.selectedTitles.length !== this.titles.length) {
        titlePart = this.selectedTitles.length
      }
      if (keywordPart && titlePart > 0) {
        return keywordPart + ` (+${titlePart} titles)`
      } else if (keywordPart) {
        return keywordPart
      } else if (titlePart > 0) {
        return `${titlePart} titles`
      }
    },
    // this creates nicer user logic
    // if upon "apply" we see no search and either all or no checkboxes, we should reset instead
    resetOverride () {
      let sameValues = null
      if (this.selectedTitles.length === this.titles.length ||
        this.selectedTitles.length === 0) {
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
        if (this.selectedAllTitles) {
          this.$set(this, 'selectedTitles', [])
        } else {
          this.$set(this, 'selectedTitles', this.titles.slice())
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
            selectedCategories: this.selectedTitles
          }
        })
      }
    },
    resetFilter () {
      this.resetSelectedTitles()
      this.searchText = ''
      // a way to communicate to datatable that filter got removed
      // same for all filter components
      this.$emit('new-filter', { columnName: this.columnName, reset: true})
    },
    resetSelectedTitles () {
      this.$set(this, 'selectedTitles', [])
    }
  },
  mounted () {
    this.titles = this.itemsMeta.titles
  }
}
</script>

<style lang="sass" scoped>
  .full-width
    width: 100%
</style>
