/* eslint-disable no-unused-vars */
import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import { CompatClient, Stomp, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

Vue.use(Vuex);

// todo
const api = axios.create({ baseURL: 'http://localhost:8080' });

let nextMsgId = 3;

export default new Vuex.Store({
    state: {
        username: null,
        availableRooms: [],
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
                author: 'Obi-Wan Kenobi',
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
        startClient({ state, commit }) {
            if (state.wsClient === null) {
                const sock = new SockJS('http://localhost:8080/webchat');
                const client = Stomp.over(sock);
                client.activate();
                commit('setClient', client);
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
        sendMessage({ commit, state }, message) {
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
