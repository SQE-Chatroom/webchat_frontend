/* eslint-disable no-unused-vars */
import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import { CompatClient, Stomp, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

Vue.use(Vuex);

let api = createApi();
let backendUrl = getDefaultBackendUrl();

let nextMsgId = 1;

function createApi() {
    return axios.create({ baseURL: 'http://localhost:8080' });
}

function getDefaultBackendUrl() {
    return 'http://localhost:8080/webchat';
}

export default new Vuex.Store({
    state: {
        username: null,
        availableRooms: {},
        currentRoom: null,
        messages: [],
        /** @type CompatClient */
        wsClient: null,
        /** @type StompSubscription */
        currentSubscription: null,
    },
    mutations: {
        setUsername(state, username) {
            state.username = username;
        },
        setClient(state, client) {
            state.wsClient = client;
        },
        setAvailableRooms(state, rooms) {
            state.availableRooms = rooms;
        },
        pushAvailableRooms(state, room) {
            state.availableRooms = { ...state.availableRooms, [room]: 1 };
        },
        clearMessages(state, message) {
            state.messages = [];
        },
        pushMessage(state, message) {
            state.messages.push({
                id: nextMsgId++,
                text: message,
                author: state.username,
            });
        },
        setCurrentRoom(state, roomId) {
            state.currentRoom = roomId;
        },
        setCurrentSubscription(state, subscription) {
            state.currentSubscription = subscription;
        },
    },
    actions: {
        async startClient({ state, commit }) {
            if (state.wsClient === null) {
                const client = Stomp.over(() => new SockJS(backendUrl));

                client.activate();
                commit('setClient', client);

                return new Promise(resolve => setTimeout(resolve, 1000));
            }
        },
        stopClient({ state, commit }) {
            if (state.wsClient !== null) {
                state.wsClient.deactivate();
                commit('setClient', null);
            }
        },
        async queryAvailableRooms({ commit }) {
            const rooms = await api.get('/chat/availableRooms/');
            commit(
                'setAvailableRooms',
                Object.entries(rooms.data).map(([key, value]) => ({ id: key, users: value })),
            );
        },
        keepUpdatingAvailableRooms({ dispatch }) {
            setInterval(() => {
                dispatch('queryAvailableRooms');
            }, 1000);
        },
        async connectToRoom({ dispatch, state, commit }, roomId) {
            if (roomId === state.currentRoom) {
                return;
            }

            await dispatch('disconnectFromCurrentRoom');

            const subscription = state.wsClient.subscribe(`/topic/${roomId}`, payload => {
                const message = JSON.parse(payload.body);

                commit('pushMessage', message);
            });

            state.wsClient.send(
                `/app/chat/${roomId}/addUser`,
                {},
                JSON.stringify({ sender: state.username, type: 'JOIN' }),
            );

            commit('setCurrentRoom', roomId);
            commit('setCurrentSubscription', subscription);
            commit('clearMessages');
        },
        disconnectFromCurrentRoom({ state, commit }) {
            if (state.currentRoom !== null) {
                state.currentSubscription.unsubscribe();

                commit('setCurrentSubscription', null);
                commit('setCurrentRoom', null);
            }
        },
        async createNewRoom({ dispatch, commit }, roomId) {
            if (roomId.length > 0) {
                commit('pushAvailableRooms', roomId);
                await dispatch('connectToRoom', roomId);
            }
        },
        sendMessage({ state }, message) {
            if (message.length === 0) {
                return;
            }

            let chatMessage = {
                sender: state.username,
                content: message,
                type: 'CHAT',
            };

            state.wsClient.send(`/app/chat/${state.currentRoom}/sendMessage`, {}, JSON.stringify(chatMessage));
        },
    },
    modules: {},
});

export function _setApiForTesting(newApi) {
    api = newApi;
}

export function _resetApiForTesting() {
    api = createApi();
}

export function _setBackendUrlForTesting(url) {
    backendUrl = url;
}

export function _resetBackendUrlForTesting() {
    backendUrl = getDefaultBackendUrl();
}
