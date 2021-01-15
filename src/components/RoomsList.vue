<template>
    <div class="rooms-list">
        <h3>
            Available Rooms:
        </h3>
        <ul>
            <li
                v-for="room in rooms"
                :key="room.id"
                @click="connectToRoom(room.id)"
                class="room"
                :class="{ 'current-room': currentRoom === room.id }"
            >
                <span>{{ room.id }}</span>
                <span>{{ room.users }} users</span>
            </li>
            <li v-if="rooms.length === 0" class="no-rooms">
                No rooms available.
            </li>
        </ul>
        <InputButtonCombo @submit="createNewRoom" title="Create new Room" :clearOnSubmit="true" />
    </div>
</template>

<script>
import InputButtonCombo from '@/components/InputButtonCombo.vue';
import { mapActions, mapState } from 'vuex';

export default {
    name: 'RoomsList',
    components: {
        InputButtonCombo,
    },
    computed: mapState({
        rooms: state => state.availableRooms,
        currentRoom: state => state.currentRoom,
    }),
    methods: mapActions(['connectToRoom', 'createNewRoom']),
};
</script>

<style scoped lang="less">
.rooms-list {
    ul {
        list-style: none;
        padding: unset;

        .room {
            display: flex;
            justify-content: space-between;
            padding: 5px;

            transition: background-color 0.25s linear;

            &:nth-child(even) {
                background: lighten(lightblue, 17.5%);
            }

            &:hover {
                background: lightblue;
                cursor: pointer;
            }
        }

        .current-room {
            font-weight: bold;
        }

        .no-rooms {
            text-align: center;
        }
    }
}
</style>
