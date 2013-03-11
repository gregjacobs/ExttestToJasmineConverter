/*global Ext, Y, tests, JsMockito, RestProxy */
tests.unit.persistence.add( new Ext.test.TestSuite( {
	name: 'RestProxy',

	items : [
		{
			/*
			 * Test buildUrl()
			 */
			name: 'Test buildUrl()',

			"buildUrl() should handle a urlRoot without a trailing slash" : function() {
				var proxy = new RestProxy( {
					urlRoot : '/testUrl',
					appendId : false
				} );

				Y.Assert.areSame( '/testUrl', proxy.buildUrl( 'create', 42 ), "buildUrl() should have returned the urlRoot when doing a 'create'" );
				Y.Assert.areSame( '/testUrl', proxy.buildUrl( 'read' ), "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)" );
				Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'read', 42 ), "buildUrl() should have appended the ID when doing a 'read'" );
				Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'update', 42 ), "buildUrl() should have appended the ID when doing a 'update'" );
				Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'delete', 42 ), "buildUrl() should have appended the ID when doing a 'delete'" );

				try {
					JsMockito.verify( proxy ).methodCalled();
					JsMockito.verify( proxy ).method2Called();
				} catch( e ) {
					Y.Assert.fail( typeof e === "string" ? e : e.message );
				}
			},


			"buildUrl() should handle a urlRoot with a trailing slash" : function() {
				var proxy = new RestProxy( {
					urlRoot : '/testUrl/',
					appendId : false
				} );

				Y.Assert.areSame( '/testUrl/', proxy.buildUrl( 'create', 42 ), "buildUrl() should have returned the urlRoot when doing a 'create'" );
				Y.Assert.areSame( '/testUrl/', proxy.buildUrl( 'read' ), "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)" );
				Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'read', 42 ), "buildUrl() should have appended the ID when doing a 'read'" );
				Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'update', 42 ), "buildUrl() should have appended the ID when doing a 'update'" );
				Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'delete', 42 ), "buildUrl() should have appended the ID when doing a 'delete'" );

				try {
					JsMockito.verify( proxy ).methodCalled();
					JsMockito.verify( proxy ).method2Called();  // some comment
				} catch( e ) {
					Y.Assert.fail( typeof e === "string" ? e : e.message );
				}

				Y.Assert.areSame( '/testUrl/42', proxy.buildUrl( 'update', 42 ), "buildUrl() should have appended the ID when doing a 'update'" );

				try {
					proxy.doSomething();
				} catch( ex ) {
					Y.Assert.fail( "Non-mockito try/catch" );
				}
			}

		}

	]

} ) );