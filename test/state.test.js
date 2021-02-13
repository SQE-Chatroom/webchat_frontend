import state, { _resetApiForTesting, _resetBackendUrlForTesting, _setApiForTesting } from '../src/store';
import http from 'http';
import express from 'express';
import { CompatClient } from '@stomp/stompjs';
import { TextDecoder, TextEncoder } from 'util';
import axios from 'axios';

global['TextDecoder'] = TextDecoder;
global['TextEncoder'] = TextEncoder;

function makeApi(port) {
    return axios.create({ baseURL: `http://localhost:${port}` });
}

describe('state', () => {
    beforeEach(() => {
        _resetApiForTesting();
        _resetBackendUrlForTesting();
    });

    describe('requires express server', () => {
        const app = express();
        const server = http.createServer(app);

        const availableRoomsFn = jest.fn().mockImplementation((req, res) => {
            res.send({ '0': 5 });
        });

        app.get('/chat/availableRooms', availableRoomsFn);

        beforeAll(() => {
            _setApiForTesting(makeApi(8001));
            return new Promise(resolve => server.listen(8001, resolve));
        });

        beforeEach(() => {
            availableRoomsFn.mockClear();
        });

        afterAll(() => {
            return new Promise(resolve => server.close(resolve));
        });

        describe('available rooms', () => {
            it('should correctly query and set the available rooms', () => {
                state.dispatch('queryAvailableRooms');

                setTimeout(() => {
                    expect(availableRoomsFn).toHaveBeenCalledTimes(1);
                    expect(state.state.availableRooms).toEqual([{ id: '0', users: 5 }]);
                }, 1000);
            });
        });
    });

    describe('requires stomp server', () => {
        it('should start and store a client', async () => {
            await state.dispatch('startClient');

            expect(state.state.wsClient).toBeInstanceOf(CompatClient);
        });

        it('should reset a client to null', async () => {
            await state.dispatch('startClient');
            await state.dispatch('stopClient');

            expect(state.state.wsClient).toBeNull();
        });

        it('should reset a client and not break if no client has been started yet', async () => {
            await state.dispatch('stopClient');

            expect(state.state.wsClient).toBeNull();
        });

        describe('requires connection', () => {
            beforeEach(async () => {
                await state.dispatch('startClient');
            });

            afterEach(async () => {
                await state.dispatch('stopClient');
            });

            describe('createNewRoom', () => {
                it('should properly add a new room', async () => {
                    await state.dispatch('createNewRoom', 'roomId');

                    expect(state.state.availableRooms).toEqual({ roomId: 1 });

                    return new Promise(resolve => {
                        setTimeout(() => {
                            expect(state.state.availableRooms).toEqual({ roomId: 1 });
                            resolve();
                        }, 1000);
                    });
                });
                it('should connect the user to that room after creating a new one', async () => {
                    await state.dispatch('createNewRoom', 'roomId');

                    return new Promise(resolve => {
                        setTimeout(() => {
                            expect(state.state.currentRoom).toEqual('roomId');
                            resolve();
                        }, 1000);
                    });
                });
            });

            describe('connectToRoom', () => {
                afterEach(async () => {
                    await state.dispatch('disconnectFromCurrentRoom', 'room');
                });

                it('should properly connect to a room', async () => {
                    await state.dispatch('createNewRoom', 'room');

                    await state.dispatch('connectToRoom', 'room');
                    expect(state.state.currentRoom).toBe('room');

                    await state.dispatch('sendMessage', 'msg');

                    return new Promise(resolve =>
                        setTimeout(() => {
                            expect(state.state.messages).toEqual([
                                {
                                    id: expect.any(Number),
                                    text: {
                                        content: 'msg',
                                        sender: null,
                                        type: 'CHAT',
                                    },
                                    author: null,
                                },
                            ]);
                            resolve();
                        }, 1000),
                    );
                });
            });

            describe('disconnectFromCurrentRoom', () => {
                it('should properly connect to a room', async () => {
                    await state.dispatch('createNewRoom', 'room');

                    await state.dispatch('connectToRoom', 'room');
                    expect(state.state.currentRoom).toBe('room');

                    await state.dispatch('disconnectFromCurrentRoom', 'room');

                    expect(state.state.currentRoom).toBeNull();
                });
            });
        });
    });
});
