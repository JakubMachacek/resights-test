<template lang="pug">
  div()
    h3() Filter genders
    br()
    v-row()
      v-col(md="6")
        v-btn(small @click="applyFilter()") Apply
      v-col(md="6")
        v-btn(small @click="resetFilter()") Reset
    v-select(
      multiple
      label="Filter genders"
      v-model="selectedGenders"
      :items="genders"
    )
      template(v-slot:prepend-item)
        v-list-item(
          ripple
          @mousedown.prevent
          @click="toggleAll"
        )
          v-list-item-action()
            v-icon(
              :color="selectedGenders.length > 0 ? 'indigo darken-4' : ''"
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
      genders: [],
      selectedGenders: []
    }
  },
  computed: {
    // Full disclosure: these three functions are stolen from Vuetify docs for v-select
    // Don't reinvent the wheel :)
    selectedAllGenders () {
      return this.selectedGenders.length === this.genders.length
    },
    selectedSomeGenders () {
      return this.selectedGenders.length > 0 && !this.selectedAllGenders
    },
    icon () {
      if (this.selectedAllGenders) return 'mdi-close-box'
      if (this.selectedSomeGenders) return 'mdi-minus-box'
      return 'mdi-checkbox-blank-outline'
    },
    // NEEDED ON EACH FILTeR COMPONENT
    // this is my way of communicating filter settings in simple way back to datatable
    // each component will have custom implementation
    getMessage () {
      let genderPart = 0
      if (this.selectedGenders.length !== this.genders.length) {
        genderPart = this.selectedGenders.length
      }
      if (genderPart > 0) {
        return `${genderPart} genders`
      }
    },
    // this creates nicer user logic
    // if upon "apply" we see no search and either all or no checkboxes, we should reset instead
    resetOverride () {
      let sameValues = null
      if (this.selectedGenders.length === this.genders.length ||
        this.selectedGenders.length === 0) {
        sameValues = true
      } else {
        sameValues = false
      }
      if (sameValues) {
        return true
      }
      return false
    }
  },
  methods: {
    toggleAll () {
      this.$nextTick(() => {
        if (this.selectedAllGenders) {
          this.$set(this, 'selectedGenders', [])
        } else {
          this.$set(this, 'selectedGenders', this.genders.slice())
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
            selectedCategories: this.selectedGenders
          }
        })
      }
    },
    resetFilter () {
      this.resetSelectedGenders()
      this.searchText = ''
      // a way to communicate to datatable that filter got removed
      // same for all filter components
      this.$emit('new-filter', { columnName: this.columnName, reset: true})
    },
    resetSelectedGenders () {
      this.$set(this, 'selectedGenders', [])
    }
  },
  mounted () {
    this.genders = this.itemsMeta.genders
  }
}
</script>

<style lang="sass" scoped>
  .full-width
    width: 100%
</style>
