/*global Ext, Y, tests, RestProxy */
tests.unit.persistence.add( new Ext.test.TestSuite( {
	name: 'RestProxy',

	items : [
		{
			/*
			 * Test buildUrl()
			 */
			name: 'Test buildUrl()',

			myHelper : function( arg1 ) {
				return arg1 + 1;
			},
			
			myHelper2 : function( arg1, arg2 ) {
				return arg1 + arg2;
			},
			
			"" : function() {   // some empty method which was left as a placeholder
				
			},
			
			"it should do something" : function() {
				this.myHelper();
				this.myHelper2();
			},


			"it should do something else" : function() {
				var a = this.myHelper();
				var b = this.myHelper2();
			}

		}

	]

} ) );