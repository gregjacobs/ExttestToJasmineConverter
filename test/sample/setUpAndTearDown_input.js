/*global Ext, Y, tests, RestProxy */
tests.unit.persistence.add( new Ext.test.TestSuite( {
	name: 'RestProxy',

	items : [
		{
			/*
			 * Test buildUrl()
			 */
			name: 'Test buildUrl()',
			setUp : function() {
				this.proxy = new RestProxy( {
					urlRoot : '/testUrl',
					appendId : false
				} );
			},

			tearDown : function() {
				this.proxy.destroy();
			},

			"buildUrl() should handle a urlRoot without a trailing slash" : function() {
				Y.Assert.areSame( '/testUrl', this.proxy.buildUrl( 'create', 42 ), "buildUrl() should have returned the urlRoot when doing a 'create'" );
				Y.Assert.areSame( '/testUrl', this.proxy.buildUrl( 'read' ), "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)" );
				Y.Assert.areSame( '/testUrl/42', this.proxy.buildUrl( 'read', 42 ), "buildUrl() should have appended the ID when doing a 'read'" );
				Y.Assert.areSame( '/testUrl/42', this.proxy.buildUrl( 'update', 42 ), "buildUrl() should have appended the ID when doing a 'update'" );
				Y.Assert.areSame( '/testUrl/42', this.proxy.buildUrl( 'delete', 42 ), "buildUrl() should have appended the ID when doing a 'delete'" );
			},


			"buildUrl() should handle a urlRoot with a trailing slash" : function() {
				Y.Assert.areSame( '/testUrl/', this.proxy.buildUrl( 'create', 42 ), "buildUrl() should have returned the urlRoot when doing a 'create'" );
				Y.Assert.areSame( '/testUrl/', this.proxy.buildUrl( 'read' ), "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)" );
				Y.Assert.areSame( '/testUrl/42', this.proxy.buildUrl( 'read', 42 ), "buildUrl() should have appended the ID when doing a 'read'" );
				Y.Assert.areSame( '/testUrl/42', this.proxy.buildUrl( 'update', 42 ), "buildUrl() should have appended the ID when doing a 'update'" );
				Y.Assert.areSame( '/testUrl/42', this.proxy.buildUrl( 'delete', 42 ), "buildUrl() should have appended the ID when doing a 'delete'" );
			}

		}

	]

} ) );