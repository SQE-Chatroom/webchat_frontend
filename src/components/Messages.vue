<template>
    <div class="messages-root">
        <div v-if="currentRoom !== null">
            <div class="messages-wrapper">
                <div v-for="({ text: message }, index) in messages" :key="index">
                    <div
                        v-if="message.type === 'CHAT'"
                        :class="message.sender === username ? 'own-message' : 'external-message'"
                    >
                        <div class="message-inner">
                            <div
                                v-if="
                                    (index === 0 || messages[index - 1].sender !== message.sender) &&
                                        message.sender !== username
                                "
                                class="message-title"
                            >
                                {{ message.sender }}
                            </div>
                            <div>
                                {{ message.content }}
                            </div>
                        </div>
                    </div>
                    <div v-else-if="message.type === 'JOIN'" class="info-message">
                        {{ message.sender }} has joined the chat.
                    </div>
                    <div v-else-if="message.type === 'LEAVE'" class="info-message">
                        {{ message.sender }} has left the chat.
                    </div>
                </div>
                <div v-if="messages.length === 0" class="no-messages-yet">
                    There are no messages in this room yet.
                </div>
            </div>
            <InputButtonCombo @submit="sendMessage" title="Send" :clearOnSubmit="true" />
        </div>
        <div v-else class="not-in-a-room">
            You are currently not in a room.
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import InputButtonCombo from '@/components/InputButtonCombo.vue';

export default {
    name: 'RoomsList',
    components: {
        InputButtonCombo,
    },
    computed: mapState({
        messages: state => state.messages,
        username: state => state.username,
        currentRoom: state => state.currentRoom,
    }),
    methods: {
        ...mapActions(['sendMessage']),
    },
};
</script>

<style scoped lang="less">
.messages-root {
    display: block;
    overflow: auto;

    .messages-wrapper {
        text-align: left;
        margin-bottom: 10px;

        .info-message {
            font-size: 0.75em;
            color: grey;
            text-align: center;
            padding: 10px;
        }

        .message-inner {
            margin: 5px;
            padding: 10px 15px;
            overflow-wrap: anywhere;
            max-width: 75%;
            border-radius: 10px;

            .message-title {
                padding-bottom: 5px;
                font-size: 0.75em;
                font-weight: 600;
            }
        }

        .own-message {
            display: flex;
            flex-direction: row-reverse;

            .message-inner {
                background: lighten(lightblue, 10%);
                border-bottom-right-radius: 0;
            }
        }

        .external-message {
            display: flex;
            flex-direction: row;

            .message-inner {
                background: lightblue;
                border-bottom-left-radius: 0;
            }
        }

        .no-messages-yet {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
        }
    }

    .not-in-a-room {
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style>
