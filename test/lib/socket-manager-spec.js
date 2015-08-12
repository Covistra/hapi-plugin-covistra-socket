var expect = require('chai').expect;
var EE = require('eventemitter2').EventEmitter2;
var env = require('../test-env');

describe('SocketManager', function() {
    var SocketManager;

    before(function() {
        var io = {};
        SocketManager = env.require('./lib/socket-manager')(env.server, io, env.log, env.config);
        console.log(SocketManager);
    });

    describe('cstor', function() {


        it('should be an EventEmitter2 instance',function() {
            var sm = new SocketManager();
            expect(sm).to.be.an.instanceOf(EE);
        });

        it('should have an empty client registry', function() {
            var sm = new SocketManager();
            expect(sm.clients).not.to.be.undefined;
            expect(sm.clients).to.eql({});
        });
    });

    describe('clientConnected', function(){
        var sm,socket;

        beforeEach(function(){
            sm = new SocketManager();
            socket = {
                id: 'test-socket-1',
                on: function(key, handler) {
                    this.handler = handler;
                }
            }
        });

        it('should trigger a client-connected event the first time a client establish a connection', function(done){
            this.timeout(100);

            sm.on('client-connected', function(client) {
                expect(client.id).to.equal('test-socket-1');
                expect(sm.clients['test-socket-1'].id).to.eql(socket.id);
                done();
            });

            sm.clientConnected(socket);
        });

        it('should mark the client as active and initialize its connection ts', function(done) {
           this.timeout(100);

            sm.on('client-connected', function(client) {
                expect(client.active).to.be.truthy;
                expect(client.ts).to.equal(1);
                done();
            });
            sm.clientConnected(socket);
        });
    });

    describe('clientDisconnected', function() {
        var sm,socket;

        beforeEach(function(){
            sm = new SocketManager();
            socket = {
                id: 'test-socket-1',
                on: function(key, handler) {
                    this.handler = handler;
                }
            };
            sm.clientConnected(socket);
        });

        it('should mark client as inactive when received a disconnect', function(done){
            sm.on('client-disconnected', function(client) {
                expect(client.active).to.be.falsy;
                expect(client.disconnectedTs).to.equal(1);
                expect(client.reconnected).to.equal(0);
                done();
            });
            sm.clientDisconnected(socket);
        });

    });

});
