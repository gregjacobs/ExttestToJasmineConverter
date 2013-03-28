/*global require, module */
var TestCaseNode = require( './TestCase' );


/**
 * @class node.DiTestCase
 * @extends node.TestCase
 * 
 * A specialization of the {@link node.TestCase TestCase} node, which represents a "direct instantiation" TestCase.
 * A "direct instantiation" TestCase is a TestCase which is the instantiation of an `Ext.test.Case` subclass. Ex:
 * 
 *     my.testcase.SubclassTest = Class.extend( Ext.test.Case, {
 *         ...
 *     } );
 *     
 *     
 *     // (Inside a test suite)
 *     new my.testcase.SubclassTest( {
 *         name : "My Test Case",
 *         
 *         "something should happen" : function() {
 *             // ...
 *         }
 *     } )
 * 
 * This node holds the name of the constructor function which is the `Ext.test.Case` subclass, so that it can be
 * instantiated and have its `setUp()` and `tearDown()` methods run for the Jasmine tests.
 */
var DiTestCaseNode = TestCaseNode.extend( {
	
	/**
	 * @constructor
	 * @param {String} ctorFnName The package + name of the class (constructor function) that is instantiated. 
	 *   Ex: `my.package.SomeTest`
	 * @param {String} name The name of the TestCase.
	 * @param {node.Should} should The Should node, if any. `null` for none.
	 * @param {node.SetUp} setUp The SetUp node, if any. `null` for none.
	 * @param {node.TearDown} tearDown The TearDown node, if any. `null` for none.
	 * @param {node.Test[]} tests The child tests.
	 */
	constructor : function( ctorFnName, name, should, setUp, tearDown, tests ) {
		this.ctorFnName = ctorFnName;
		
		this._super( [ name, should, setUp, tearDown, tests ] );
	},
	
	
	/**
	 * Retrieves the package + name of the class (constructor function) that is instantiated.
	 * 
	 * @return {String}
	 */
	getCtorFnName : function() {
		return this.ctorFnName;
	}
	
} );

module.exports = DiTestCaseNode;