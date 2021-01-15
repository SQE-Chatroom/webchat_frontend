<template>
    <div v-if="username !== null" class="home">
        <RoomsList />
        <Messages />
    </div>
    <div v-else class="home">
        <div class="set-username-dialog">
            <h3>Enter Username</h3>
            <InputButtonCombo @submit="setUsername" title="Start" :clearOnSubmit="true" />
        </div>
    </div>
</template>

<script>
// @ is an alias to /src
import RoomsList from '@/components/RoomsList.vue';
import Messages from '@/components/Messages.vue';
import InputButtonCombo from '@/components/InputButtonCombo.vue';
import { mapState, mapMutations } from 'vuex';

export default {
    name: 'Home',
    components: {
        RoomsList,
        Messages,
        InputButtonCombo,
    },
    computed: mapState({
        username: state => state.username,
    }),
    methods: mapMutations(['setUsername']),
    mounted() {
        this.$store.dispatch('startClient');
        this.$store.dispatch('keepUpdatingAvailableRooms');
    },
    destroyed() {
        this.store.dispatch('stopClient');
    },
};
</script>

<style lang="less" scoped>
.home {
    display: flex;
    gap: 10px;
    width: 65%;
    margin: auto;
    justify-content: center;

    & > * {
        flex: 1;
    }

    & > :first-child {
        max-width: 30%;
    }

    .set-username-dialog {
        margin-top: 15%;
        text-align: center;
    }
}
</style>
