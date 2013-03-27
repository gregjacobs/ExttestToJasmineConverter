/*global require, describe, beforeEach, afterEach, it */
var expect = require( 'chai' ).expect,
    JasmineTransformVisitor = require( '../../src/node/JasmineTransformVisitor' ),
    SuiteNode = require( '../../src/node/Suite' ),
    TestCaseNode = require( '../../src/node/TestCase' ),
    ShouldNode = require( '../../src/node/Should' ),
    SetUpNode = require( '../../src/node/SetUp' ),
    TearDownNode = require( '../../src/node/TearDown' ),
    TestNode = require( '../../src/node/Test' );

describe( 'node.JasmineTransformVisitor', function() {
	
	describe( 'visitSetUp()', function() {
		
		it( "should convert `this` references to `thisSuite`", function() {
			var jasmineTransformVisitor = new JasmineTransformVisitor();
			
			var input = [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			var setUp = new SetUpNode( input );
			
			jasmineTransformVisitor.visitSetUp( setUp );
			expect( setUp.getBody() ).to.equal( [
				'thisSuite.a = 1;',
				'thisSuite.b = 2;'
			].join( "\n" ) );
		} );
		
	} );
	
	describe( 'visitTearDown()', function() {
		
		it( "should convert `this` references to `thisSuite`", function() {
			var jasmineTransformVisitor = new JasmineTransformVisitor();
			
			var input = [
				'this.a.destroy();',
				'this.b.destroy();'
			].join( "\n" );
			var tearDown = new TearDownNode( input );
			
			jasmineTransformVisitor.visitTearDown( tearDown );
			expect( tearDown.getBody() ).to.equal( [
				'thisSuite.a.destroy();',
				'thisSuite.b.destroy();'
			].join( "\n" ) );
		} );
		
	} );
	
	
	
	describe( 'transformThisReferences()', function() {
		
		it( "should change all `this` references to `thisSuite`", function() {
			var jasmineTransformVisitor = new JasmineTransformVisitor();
			
			var input = [
				'this.a.destroy();',
				'this.b.destroy();'
			].join( "\n" );
			
			var output = jasmineTransformVisitor.transformThisReferences( input );
			expect( output ).to.equal( [
				'thisSuite.a.destroy();',
				'thisSuite.b.destroy();'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( "removeTryCatchAroundJsMockito()", function() {
		var jasmineTransformVisitor;
		
		beforeEach( function() {
			jasmineTransformVisitor = new JasmineTransformVisitor();
		} );
		
		it( "should remove a try/catch block for JsMockito", function() {
			var input = [
				'try {',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}'
			].join( "\n" );
			
			var expected = [
				'JsMockito.verify( models[ 0 ] ).save();',
				'JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();'
			].join( "\n" );
			
			expect( jasmineTransformVisitor.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
		
		it( "should remove multiple try/catch blocks for JsMockito", function() {
			var input = [
				'try {',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}',
				'// some other code here',
				'try {',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}'
			].join( "\n" );
			
			var expected = [
				'JsMockito.verify( models[ 0 ] ).save();',
				'JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'// some other code here',
				'JsMockito.verify( models[ 0 ] ).save();',
				'JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();'
			].join( "\n" );
			
			expect( jasmineTransformVisitor.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
		
		it( "should remove multiple try/catch blocks for JsMockito, and properly format whitespace when indented", function() {
			var input = [
				'\ttry {',
				'\t\tJsMockito.verify( models[ 0 ] ).save();',
				'\t\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\t\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\t\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'\t} catch( e ) {',
				'\t\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'\t}',
				'\t// some other code here',
				'\ttry {',
				'\t\tJsMockito.verify( models[ 0 ] ).save();',
				'\t\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\t\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\t\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'\t} catch( e ) {',
				'\t\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'\t}'
			].join( "\n" );
			
			var expected = [
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'\t// some other code here',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();'
			].join( "\n" );
			
			expect( jasmineTransformVisitor.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
		
		it( "should leave non-JsMockito try/catch blocks alone", function() {
			var input = [
				'try {',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}',
				'// some other code here',
				'try {',
				'\t// Some other test here',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}'
			].join( "\n" );
			
			var expected = [
				'JsMockito.verify( models[ 0 ] ).save();',
				'JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'// some other code here',
				'try {',
				'\t// Some other test here',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}'
			].join( "\n" );
			
			expect( jasmineTransformVisitor.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
	} );
	
	
	
	describe( "convertAssertions()", function() {
		var jasmineTransformVisitor,
		    jtv;  // shorthand
		
		beforeEach( function() {
			jasmineTransformVisitor = new JasmineTransformVisitor();
			jtv = jasmineTransformVisitor;
		} );
		
		
		describe( "Y.Assert package assertions", function() {			
			
			it( "should properly convert Y.ArrayAssert.isUndefined() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isUndefined( myObj );' ) )
					.to.equal( 'expect( _.isUndefined( myObj ) ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isUndefined( myObj, "myObj should be undefined" );' ) )
					.to.equal( 'expect( _.isUndefined( myObj ) ).toBe( true );  // orig YUI Test err msg: "myObj should be undefined"' );
			} );
			
			
			it( "should properly convert Y.Assert.isNull() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isNull( someVar );' ) )
					.to.equal( 'expect( someVar ).toBe( null );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isNull( someVar, "someVar should have been null" );' ) )
					.to.equal( 'expect( someVar ).toBe( null );  // orig YUI Test err msg: "someVar should have been null"' );
			} );
			
			
			it( "should properly convert Y.Assert.isNotNull() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isNotNull( someVar );' ) )
					.to.equal( 'expect( someVar ).not.toBe( null );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isNotNull( someVar, "someVar should have not been null" );' ) )
					.to.equal( 'expect( someVar ).not.toBe( null );  // orig YUI Test err msg: "someVar should have not been null"' );
			} );
			
			
			it( "should properly convert Y.Assert.isTrue() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isTrue( something );' ) )
					.to.equal( 'expect( something ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isTrue( something, "something should have been true" );' ) )
					.to.equal( 'expect( something ).toBe( true );  // orig YUI Test err msg: "something should have been true"' );
			} );
			
			
			it( "should properly convert Y.Assert.isFalse() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isFalse( something );' ) )
					.to.equal( 'expect( something ).toBe( false );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isFalse( something, "something should have been false" );' ) )
					.to.equal( 'expect( something ).toBe( false );  // orig YUI Test err msg: "something should have been false"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.isString() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isString( myString );' ) )
					.to.equal( 'expect( _.isString( myString ) ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isString( myString, "myString should be a string" );' ) )
					.to.equal( 'expect( _.isString( myString ) ).toBe( true );  // orig YUI Test err msg: "myString should be a string"' );
			} );
			
			
			it( "should properly convert Y.Assert.isObject() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isObject( someVar );' ) )
					.to.equal( 'expect( _.isObject( someVar ) ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isObject( someVar, "someVar should have been an object" );' ) )
					.to.equal( 'expect( _.isObject( someVar ) ).toBe( true );  // orig YUI Test err msg: "someVar should have been an object"' );
			} );
			
			
			it( "should properly convert Y.Assert.isArray() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isArray( someVar );' ) )
					.to.equal( 'expect( _.isArray( someVar ) ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isArray( someVar, "someVar should have been an array" );' ) )
					.to.equal( 'expect( _.isArray( someVar ) ).toBe( true );  // orig YUI Test err msg: "someVar should have been an array"' );
			} );
			
			
			it( "should properly convert Y.Assert.isInstanceOf() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.isInstanceOf( SomeClass, someVar );' ) )
					.to.equal( 'expect( someVar instanceof SomeClass ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.isInstanceOf( SomeClass, someVar, "someVar should have been an instance of SomeClass" );' ) )
					.to.equal( 'expect( someVar instanceof SomeClass ).toBe( true );  // orig YUI Test err msg: "someVar should have been an instance of SomeClass"' );
			} );
			
			
			it( "should properly convert Y.Assert.areSame() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.areSame( something, somethingElse );' ) )
					.to.equal( 'expect( somethingElse ).toBe( something );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.areSame( something, somethingElse, "something should have been somethingElse" );' ) )
					.to.equal( 'expect( somethingElse ).toBe( something );  // orig YUI Test err msg: "something should have been somethingElse"' );
			} );
			
			
			it( "should properly convert Y.Assert.areEqual() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.areEqual( something, somethingElse );' ) )
					.to.equal( 'expect( somethingElse ).toEqual( something );' );
				
				expect( jtv.convertAssertions( 'Y.Assert.areEqual( something, somethingElse, "something should have been equal to somethingElse" );' ) )
					.to.equal( 'expect( somethingElse ).toEqual( something );  // orig YUI Test err msg: "something should have been equal to somethingElse"' );
			} );
			
			
			it( "should properly convert Y.Assert.fail() assertions", function() {
				expect( jtv.convertAssertions( 'Y.Assert.fail( "test should have errored by now" );' ) )
					.to.equal( 'expect( true ).toBe( false );  // orig YUI Test err msg: "test should have errored by now"' );
			} );
		
		} );
		
		
		describe( "Y.ArrayAssert package assertions", function() {
			
			it( "should properly convert Y.ArrayAssert.contains() assertions", function() {
				expect( jtv.convertAssertions( 'Y.ArrayAssert.contains( "myElem", elems );' ) )
					.to.equal( 'expect( elems ).toContain( "myElem" );' );
				
				expect( jtv.convertAssertions( 'Y.ArrayAssert.contains( "myElem", elems, "elems should contain myElem" );' ) )
					.to.equal( 'expect( elems ).toContain( "myElem" );  // orig YUI Test err msg: "elems should contain myElem"' );
			} );
			
			it( "should properly convert Y.ArrayAssert.doesNotContain() assertions", function() {
				expect( jtv.convertAssertions( 'Y.ArrayAssert.doesNotContain( "myElem", elems );' ) )
					.to.equal( 'expect( elems ).not.toContain( "myElem" );' );
				
				expect( jtv.convertAssertions( 'Y.ArrayAssert.doesNotContain( "myElem", elems, "elems should not contain myElem" );' ) )
					.to.equal( 'expect( elems ).not.toContain( "myElem" );  // orig YUI Test err msg: "elems should not contain myElem"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.containsItems() assertions", function() {
				expect( jtv.convertAssertions( 'Y.ArrayAssert.containsItems( [ "a", "b" ], elems );' ) )
					.to.equal( 'expect( _.intersection( [ "a", "b" ], elems ).length ).toBe( [ "a", "b" ].length );' );
				
				expect( jtv.convertAssertions( 'Y.ArrayAssert.containsItems( myEls, elems );' ) )
					.to.equal( 'expect( _.intersection( myEls, elems ).length ).toBe( myEls.length );' );
				
				expect( jtv.convertAssertions( 'Y.ArrayAssert.containsItems( [ "a", "b" ], elems, "elems should contain a and b" );' ) )
					.to.equal( 'expect( _.intersection( [ "a", "b" ], elems ).length ).toBe( [ "a", "b" ].length );  // orig YUI Test err msg: "elems should contain a and b"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.itemsAreSame() assertions", function() {
				expect( jtv.convertAssertions( 'Y.ArrayAssert.itemsAreSame( [ "attr1", "attr2" ], attrs );' ) )
					.to.equal( 'expect( attrs ).toEqual( [ "attr1", "attr2" ] );' );
				
				expect( jtv.convertAssertions( 'Y.ArrayAssert.itemsAreSame( [ "attr1", "attr2" ], attrs, "attrs should be attr1 and attr2" );' ) )
					.to.equal( 'expect( attrs ).toEqual( [ "attr1", "attr2" ] );  // orig YUI Test err msg: "attrs should be attr1 and attr2"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.isEmpty() assertions", function() {
				expect( jtv.convertAssertions( 'Y.ArrayAssert.isEmpty( attrs );' ) )
					.to.equal( 'expect( attrs ).toEqual( [] );' );
				
				expect( jtv.convertAssertions( 'Y.ArrayAssert.isEmpty( attrs, "attrs should be empty" );' ) )
					.to.equal( 'expect( attrs ).toEqual( [] );  // orig YUI Test err msg: "attrs should be empty"' );
			} );
			
		} );
		
		
		describe( "Y.ObjectAssert package assertions", function() {
			
			it( "should properly convert Y.ObjectAssert.hasKey() assertions", function() {
				expect( jtv.convertAssertions( 'Y.ObjectAssert.hasKey( "attr1", data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.ObjectAssert.hasKey( "attr1", data, "data should have attr1" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1"' );
			} );
			
			it( "should properly convert Y.ObjectAssert.ownsKeys() assertions", function() {
				expect( jtv.convertAssertions( 'Y.ObjectAssert.ownsKeys( [ "attr1", "attr2" ], data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.ObjectAssert.ownsKeys( [ "attr1", "attr2" ], data, "data should have attr1 and attr2" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1 and attr2"' );
			} );
			
			it( "should properly convert Y.ObjectAssert.hasKeys() assertions", function() {
				expect( jtv.convertAssertions( 'Y.ObjectAssert.hasKeys( [ "attr1", "attr2" ], data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );' );
				
				expect( jtv.convertAssertions( 'Y.ObjectAssert.hasKeys( [ "attr1", "attr2" ], data, "data should have attr1 and attr2" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1 and attr2"' );
			} );
			
		} );
		
	} );
	
} );
		