<template lang="pug">
  div()
    h3() Filter years
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
        ).full-width
      v-col(md="6")
        v-text-field(
          label="To"
          v-model.number="rangeTo"
          :rules="[numberRule]"
        ).full-width
</template>

<script>
export default {
  props: [ 'columnName', 'itemsMeta' ],
  data() {
    return {
      rangeFrom: '',
      rangeTo: '',
      numberRule: v  => {
        if (!isNaN(parseFloat(v)) && v >= 0) return true
        return 'This is not a non-negative number.'
      }
    }
  },
  computed: {
    // NEEDED ON EACH FILTeR COMPONENT
    // this is my way of communicating filter settings in simple way back to datatable
    // each component will have custom implementation
    getMessage () {
      let keywordPart = ''
      if (this.rangeFrom) {
        keywordPart += `From ${this.rangeFrom}`
      }
      if (this.rangeTo) {
        keywordPart += `${this.rangeFrom ? ' to' : 'To'} ${this.rangeTo}`
      }
      return keywordPart
    },
    // this creates nicer user logic
    // if upon "apply" we see no search and either all or no checkboxes, we should reset instead
    resetOverride () {
      if (!this.rangeFrom && !this.rangeTo) {
        return true
      }
      return false
    }
  },
  methods: {
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
            }
          }
        })
      }
    },
    resetFilter () {
      this.rangeFrom = ''
      this.rangeTo = ''
      // a way to communicate to datatable that filter got removed
      // same for all filter components
      this.$emit('new-filter', { columnName: this.columnName, reset: true})
    }
  },
  mounted () {
  }
}
</script>

<style lang="sass" scoped>
  .full-width
    width: 100%
</style>
