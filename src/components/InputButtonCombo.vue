<template>
    <div class="input-button-combo">
        <input type="text" v-model="value" @keypress.enter="submit" />
        <input type="button" :value="title" @click="submit" />
    </div>
</template>

<script>
export default {
    props: ['title', 'clearOnSubmit'],
    data() {
        return {
            value: '',
        };
    },
    methods: {
        submit() {
            this.$emit('submit', this.value);

            if (this.clearOnSubmit) {
                this.value = '';
            }
        },
    },
};
</script>

<style lang="less" scoped>
.input-button-combo {
    display: flex;

    border: 1px solid lightgray;
    border-radius: 5px;

    input {
        border: none;
        background: none;
        padding: 10px;
        min-width: 0;

        &[type='text'] {
            flex: 1;

            border-right: 1px solid lightgray;
        }

        &[type='button'] {
            padding: 0 15px;

            &:hover {
                background: lighten(lightgray, 10%);
            }

            &:active {
                background: darken(lightgray, 10%);
            }
        }
    }
}
</style>
