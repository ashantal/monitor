var Fabric_Client = require('fabric-client');
var path          = require('path');
var util          = require('util');
var os            = require('os');
var config 		  = require('./config.json');

module.exports = (function() {
	return{
	emit_events: function(io, options, event){
		var fabric_client = new Fabric_Client();
		var channel = fabric_client.newChannel(config.channel);
		var peer = fabric_client.newPeer(config.peer);
		channel.addPeer(peer);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);
		    return fabric_client.getUserContext(config.user, true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user.... run registerUser.js');
			}
			const channel_event_hub = channel.newChannelEventHub(peer.getName());
			const block_reg = channel_event_hub.registerBlockEvent((full_block) => {
				//console.log(util.inspect(full_block, false, null, true /* enable colors */));
				try{
					var bh = full_block.header;
					var payload = full_block.data.data[0].payload;
					var action = payload.data.actions[0].payload.action;
					var ph = payload.header;
					//console.log(util.inspect(action, false, null, true /* enable colors */));
					var set = action.proposal_response_payload.extension.results.ns_rwset[0];
					var write = set.rwset.writes[0];
					var data = {
						'block' : bh.number,
						'channel' : ph.channel_header.channel_id,
						'msp' : ph.signature_header.creator.Mspid,
						'namespace' : set.namespace,
						'transaction' : write.value,
					}
					console.log(data);
					io.emit('event', data);
				}
				catch(ex){
					console.log(ex);
				}
			}, (error)=> {
				console.log('Failed to receive the block event ::'+error);
			},
			options);
			channel_event_hub.connect(true); //get full blocks
		}).catch((err) => {
			io.emit('error','Failed to invoke ' + err);
		});
	}
}
})();