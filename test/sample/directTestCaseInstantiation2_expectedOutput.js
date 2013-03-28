/*global window, jQuery, Class, Kevlar, Jux, ui, app, _, describe, beforeEach, afterEach, it, expect, JsMockito */
app.controllers.quark.edit.AbstractSlideshowTest = Class.extend( app.controllers.quark.edit.QuarkTest, {
	
	setUp : function() {
		this._super();
		
		// A concrete subclass for testing with empty implementations for abstract methods
		this.AbstractSlideshow = app.controllers.quark.edit.AbstractSlideshow.extend( {
			createSlideModel : function() { return JsMockito.mock( app.models.Slide ); },
			createSlideSelectorItem : function() { return JsMockito.mock( app.views.palette.controls.carousel.CarouselItem.extend( { constructor: function(){} } ) ); }  // constructorless subclass
		} );
		
		
		// The slides collection
		this.slidesCollection = JsMockito.mock( app.collections.Slides );
		JsMockito.when( this.model ).get( 'slides' ).thenReturn( this.slidesCollection );
		
		// Create the mock panels and controls needed for the AbstractSlideshow
		this.carousel = JsMockito.mock( app.views.palette.controls.carousel.Carousel );
		this.slidesItemSelector = JsMockito.mock( app.components.controls.itemSelector.ItemSelector );
		JsMockito.when( this.carousel ).getItemSelector().thenReturn( this.slidesItemSelector );
		
		this.slideEditPanelContainer = JsMockito.mock( ui.Container );
		this.slideEditPanelContainerLayout = JsMockito.mock( ui.layout.CardsLayout );
		JsMockito.when( this.slideEditPanelContainer ).getLayout().thenReturn( this.slideEditPanelContainerLayout );
		
		this.titleSlideEditPanel = JsMockito.mock( ui.Container );
		this.generalSlideEditPanel = JsMockito.mock( ui.Container );
		
		this.slideTitleField = JsMockito.mock( ui.formFields.TextField );
		this.pictureSelector = JsMockito.mock( app.components.controls.PictureSelector );
		this.slideTitleField = JsMockito.mock( ui.formFields.TextField );
		this.slideDescriptionField = JsMockito.mock( ui.formFields.TextField );
		this.pictureSizeSelector = JsMockito.mock( app.components.controls.itemSelector.ItemSelector );
		this.layoutSelector = JsMockito.mock( app.components.controls.itemSelector.ItemSelector );
		
		
		
		// Set up the Palette to retrieve the controls that need to be retrieved
		JsMockito.when( this.controlsPanel ).findById( 'carousel' ).thenReturn( this.carousel );
		
		JsMockito.when( this.controlsPanel ).findById( 'slideEditPanelContainer' ).thenReturn( this.slideEditPanelContainer );
		JsMockito.when( this.controlsPanel ).findById( 'titleSlideEditPanel' ).thenReturn( this.titleSlideEditPanel );
		JsMockito.when( this.controlsPanel ).findById( 'generalSlideEditPanel' ).thenReturn( this.generalSlideEditPanel );
		
		JsMockito.when( this.controlsPanel ).findByKey( 'title' ).thenReturn( this.slideTitleField );
		JsMockito.when( this.controlsPanel ).findById( 'slidesItemSelector' ).thenReturn( this.slidesItemSelector );
		JsMockito.when( this.controlsPanel ).findById( 'pictureSelector' ).thenReturn( this.pictureSelector );
		JsMockito.when( this.controlsPanel ).findById( 'slideTitleField' ).thenReturn( this.slideTitleField );
		JsMockito.when( this.controlsPanel ).findById( 'slideDescriptionField' ).thenReturn( this.slideDescriptionField );
		JsMockito.when( this.controlsPanel ).findById( 'pictureSizeSelector' ).thenReturn( this.pictureSizeSelector );
		JsMockito.when( this.controlsPanel ).findById( 'layoutSelector' ).thenReturn( this.layoutSelector );
		
		
		// A mock Slide model for tests to work with
		this.slideModel = JsMockito.mock( app.models.Slide );
		JsMockito.when( this.slidesCollection ).getModels().thenReturn( [ this.slideModel ] );
		
		this.picture = JsMockito.mock( app.models.PictureWithOptions );  // and a Picture for the model
		JsMockito.when( this.slideModel ).get( 'picture' ).thenReturn( this.picture );
		
		// And a mock slide Item for tests to work with. 
		this.slideItem = JsMockito.mock( app.views.palette.controls.carousel.CarouselItem.extend( { constructor: function(){} } ) );  // Need to overwrite constructor so we don't need required configs
		
		// Hook up the slideItemSelector to return a SlideItem, and the slideItem to return the Slide model
		JsMockito.when( this.slidesItemSelector ).getSelected().thenReturn( this.slideItem );
		JsMockito.when( this.slideItem ).getModel().thenReturn( this.slideModel );
	},
	
	
	/**
	 * Creates the appropriate model for the AbstractSlideshow tests.
	 * 
	 * @protected
	 * @method createModel
	 * @return {app.models.AbstractSlideshow}
	 */
	createModel : function() {
		var AbstractSlideshow = app.models.AbstractSlideshow.extend( {
			getFonts : function() { return [ 'font1', 'font2' ]; }
		} );
		
		return JsMockito.mock( AbstractSlideshow );
	}
	
} );



describe( "unit.app.controllers.quark.edit.AbstractSlideshow", function() {
	
	describe( "Test onSlideSelect()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onSlideSelect() should update the model's 'activeItemId' attribute, when it has an empty string for the ID", function() {
			var slideId = "";
			JsMockito.when( thisSuite.slideModel ).getId().thenReturn( slideId );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onSlideSelect( thisSuite.slidesItemSelector, thisSuite.slideItem );
			
			JsMockito.verify( thisSuite.model ).set( 'activeItemId', slideId );
		} );
		
		
		it( "onSlideSelect() should update the model's 'activeItemId' attribute, when it has an actual ID", function() {
			var slideId = 1;
			JsMockito.when( thisSuite.slideModel ).getId().thenReturn( slideId );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onSlideSelect( thisSuite.slidesItemSelector, thisSuite.slideItem );
			
			JsMockito.verify( thisSuite.model ).set( 'activeItemId', slideId );
		} );
		
		
		it( "onSlideSelect() should switch the 'slideEditPanelContainer' card to the 'titleSlideEditPanel' when the 'title' slide is selected", function() {
			var slideId = "";  // the id of the special "title" slide (i.e. an empty string; not an actual id of a "general" slide)
			JsMockito.when( thisSuite.slideModel ).getId().thenReturn( slideId );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onSlideSelect( thisSuite.slidesItemSelector, thisSuite.slideItem );
			
			JsMockito.verify( thisSuite.slideEditPanelContainerLayout ).setActiveItem( thisSuite.titleSlideEditPanel );
		} );
		
		
		it( "onSlideSelect() should switch the 'slideEditPanelContainer' card to the 'generalSlideEditPanel' when a 'general' slide is selected", function() {
			var slideId = 1;  // the id of a "general" slide (i.e. not the empty string id of the "title" slide)
			JsMockito.when( thisSuite.slideModel ).getId().thenReturn( slideId );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onSlideSelect( thisSuite.slidesItemSelector, thisSuite.slideItem );
			
			JsMockito.verify( thisSuite.slideEditPanelContainerLayout ).setActiveItem( thisSuite.generalSlideEditPanel );
		} );
		
		
		it( "onSlideSelect() should update the controls in the 'generalSlideEditPanel' to the newly selected slide model's attributes, when a 'general' slide is selected", function() {
			var slideId = 1,  // the id of a "general" slide (i.e. not the empty string id of the "title" slide)
			    picture = JsMockito.mock( app.models.PictureWithOptions ),
			    slideTitleFieldValue = "testTitleFieldValue",
			    slideDescriptionFieldValue = "testDescriptionFieldValue",
			    pictureSize = 'fill',
			    layout = 'left';
			
			JsMockito.when( thisSuite.slideModel ).getId().thenReturn( slideId );
			JsMockito.when( thisSuite.slideModel ).get( 'picture' ).thenReturn( picture );
			JsMockito.when( thisSuite.slideModel ).get( 'title' ).thenReturn( slideTitleFieldValue );
			JsMockito.when( thisSuite.slideModel ).get( 'description' ).thenReturn( slideDescriptionFieldValue );
			JsMockito.when( thisSuite.slideModel ).get( 'picture_size' ).thenReturn( pictureSize );
			JsMockito.when( thisSuite.slideModel ).get( 'layout' ).thenReturn( layout );
			
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onSlideSelect( thisSuite.slidesItemSelector, thisSuite.slideItem );
			
			JsMockito.verify( thisSuite.pictureSelector ).setPicture( picture );
			JsMockito.verify( thisSuite.slideTitleField ).setValue( slideTitleFieldValue );
			JsMockito.verify( thisSuite.slideDescriptionField ).setValue( slideDescriptionFieldValue );
			JsMockito.verify( thisSuite.pictureSizeSelector ).select( pictureSize );
			JsMockito.verify( thisSuite.layoutSelector ).select( layout );
		} );
		
	} );
	
	
	describe( "Test onAddSlideClick()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
			
			// Make a new subclass of thisSuite.AbstractSlideshow with actual implementations of createSlideModel() and createSlideSelectorItem()
			thisSuite.AbstractSlideshow = thisSuite.AbstractSlideshow.extend( {
				createSlideModel : function() {
					return thisSuite.slideModel;
				}.createDelegate( this ),
				
				createSlideSelectorItem : function() {
					return thisSuite.slideItem;
				}.createDelegate( this )
			} );
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onAddSlideClick() should add a new Slide model to the collection, select it in the slidesItemSelector, and scroll to the new item", function() {
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onAddSlideClick();
			
			JsMockito.verify( thisSuite.slidesCollection ).add( thisSuite.slideModel );
			JsMockito.verify( thisSuite.slidesItemSelector ).add( thisSuite.slideItem );
			JsMockito.verify( thisSuite.slidesItemSelector ).select( thisSuite.slideItem );
			JsMockito.verify( thisSuite.slidesItemSelector ).scrollToItem( thisSuite.slideItem );
		} );
		
	} );
	
	
	describe( "Test onRemoveSlideClick()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onRemoveSlideClick() should remove the slide's Slide model from the collection", function() {
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onRemoveSlideClick( thisSuite.slideItem );
			
			JsMockito.verify( thisSuite.slidesCollection ).remove( thisSuite.slideModel );
		} );
		
		
		it( "onRemoveSlideClick() should select the 'next' item when a slide other than the last slide is removed", function() {
			JsMockito.when( thisSuite.slidesItemSelector ).getItemIndex( thisSuite.slideItem ).thenReturn( 1 );  // the 1st of the 2 slides
			JsMockito.when( thisSuite.slidesItemSelector ).getCount().thenReturn( 2 );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onRemoveSlideClick( thisSuite.slideItem );
			
			JsMockito.verify( thisSuite.slidesItemSelector, JsMockito.Verifiers.times( 2 ) ).selectItemAt( 0 );  // should select the first (in this case, the only remaining) item. Note: 1 call comes from the AbstractSlideshow constructor
		} );
		
		
		it( "onRemoveSlideClick() should select the 'previous' item when the last slide in the collection is removed", function() {
			JsMockito.when( thisSuite.slidesItemSelector ).getItemIndex( thisSuite.slideItem ).thenReturn( 1 );  // the 2nd of the 2 slides
			JsMockito.when( thisSuite.slidesItemSelector ).getCount().thenReturn( 2 );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onRemoveSlideClick( thisSuite.slideItem );
			
			JsMockito.verify( thisSuite.slidesItemSelector, JsMockito.Verifiers.times( 2 ) ).selectItemAt( 0 );  // should select the first (in this case, the only remaining) item. Note: 1 call comes from the AbstractSlideshow constructor
		} );
		
	} );
	
	
	describe( "Test onSlideReorder()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
			
			thisSuite.slideModel0 = JsMockito.mock( app.models.Slide );
			thisSuite.slideModel1 = JsMockito.mock( app.models.Slide );
			thisSuite.slideModel2 = JsMockito.mock( app.models.Slide );
			
			JsMockito.when( thisSuite.slidesCollection ).has( thisSuite.slideModel0 ).thenReturn( true );
			JsMockito.when( thisSuite.slidesCollection ).has( thisSuite.slideModel1 ).thenReturn( true );
			JsMockito.when( thisSuite.slidesCollection ).has( thisSuite.slideModel2 ).thenReturn( true );
			
			var ModelItem = app.components.controls.itemSelector.ModelItem.extend( { constructor: function(){} } );
			thisSuite.slideItem0 = JsMockito.mock( ModelItem );
			thisSuite.slideItem1 = JsMockito.mock( ModelItem );
			thisSuite.slideItem2 = JsMockito.mock( ModelItem );
			
			JsMockito.when( thisSuite.slideItem0 ).getModel().thenReturn( thisSuite.slideModel0 );
			JsMockito.when( thisSuite.slideItem1 ).getModel().thenReturn( thisSuite.slideModel1 );
			JsMockito.when( thisSuite.slideItem2 ).getModel().thenReturn( thisSuite.slideModel2 );
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onSlideReorder() should reorder the Slide's model in the collection (when reordered in the ItemSelector by the user)", function() {
			JsMockito.when( thisSuite.slidesItemSelector ).getItems().thenReturn( [ thisSuite.slideItem0, thisSuite.slideItem1, thisSuite.slideItem2 ] );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onSlideReorder( thisSuite.slidesItemSelector, thisSuite.slideItem2, 1, 2 );  // moving from index 2 to 1 
							
			JsMockito.verify( thisSuite.slidesCollection ).insert( thisSuite.slideModel2, 1 );
			
			abstractSlideshow.destroy();  // clean up
		} );
		
		
		it( "onSlideReorder() should properly reorder the Slide's model in the collection when there are extra (non-collection) ModelItem in the ItemSelector", function() {
			var extraItem1 = new app.components.controls.itemSelector.ModelItem( {
				model : JsMockito.mock( Kevlar.Model ),
				tpl : function() {}
			} );
			var extraItem2 = new app.components.controls.itemSelector.Item( {   // a non-ModelItem, just to make sure that these are handled
				tpl : function() {}
			} );
			var extraItem3 = new app.components.controls.itemSelector.ModelItem( {
				model : JsMockito.mock( Kevlar.Model ),
				tpl : function() {}
			} );
			
			
			// Add the "extraItems" in with the model items, so that it would mess up the normal offset into the collection for a moved ModelItem
			JsMockito.when( thisSuite.slidesItemSelector ).getItems().thenReturn( [ extraItem1, extraItem2, thisSuite.slideItem0, thisSuite.slideItem1, thisSuite.slideItem2, extraItem3 ] );
			
			// We're going to pretend we've moved the last of the collection's model components (the 5th component) to be the 4th component.
			// This *should* move it to index 1 (position 2) in the collection though, as there are 2 "extra" components before it
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onSlideReorder( thisSuite.slidesItemSelector, thisSuite.slideItem2, 3, 4 );  // moving from index 4 to 3
			
			JsMockito.verify( thisSuite.slidesCollection ).insert( thisSuite.slideModel2, 1 );  // Should still be inserted into the Collection at index 1, to account for the "extra items"
			
			abstractSlideshow.destroy();  // clean up
		} );
		
	} );
	
	
	describe( "Test onPictureChange()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
			
			var picture = JsMockito.mock( app.models.PictureWithOptions );
			JsMockito.when( thisSuite.slideModel ).get( 'picture' ).thenReturn( picture );
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onPictureChange() should update the slide model's 'picture' attribute with the new picture", function() {
			var picture = JsMockito.mock( app.models.PictureWithOptions );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onPictureChange( thisSuite.pictureSelector, picture );
			
			JsMockito.verify( thisSuite.slideModel ).set( 'picture', picture );
		} );
		
	} );
	
	
	describe( "Test onTitleChange()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onTitleChange() should update the slide model's 'title' attribute with the new value of the slideTitleField", function() {
			var slideTitleFieldValue = "testValue";
			JsMockito.when( thisSuite.slideTitleField ).getValue().thenReturn( slideTitleFieldValue );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onTitleChange( thisSuite.slideTitleField, /* no evt arg needed */ null );
			
			JsMockito.verify( thisSuite.slideModel ).set( 'title', slideTitleFieldValue );
			JsMockito.verifyNoMoreInteractions( thisSuite.slideModel );
		} );
		
	} );
	
	
	describe( "Test onDescriptionChange()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onDescriptionChange() should update the slide model's 'description' attribute with the new value of the slideDescriptionField", function() {
			var slideDescriptionFieldValue = "testValue";
			JsMockito.when( thisSuite.slideDescriptionField ).getValue().thenReturn( slideDescriptionFieldValue );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onDescriptionChange( thisSuite.slideDescriptionField, /* no evt arg needed */ null );
			
			JsMockito.verify( thisSuite.slideModel ).set( 'description', slideDescriptionFieldValue );
			JsMockito.verifyNoMoreInteractions( thisSuite.slideModel );
		} );
		
	} );
	
	
	describe( "Test onPictureSizeChange()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onPictureSizeChange() should update the slide model's 'picture_size' attribute with the newly selected item's value", function() {
			var pictureSizeValue = 'fill';
			var item = JsMockito.mock( app.components.controls.itemSelector.Item );
			JsMockito.when( item ).getValue().thenReturn( pictureSizeValue );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onPictureSizeChange( thisSuite.pictureSizeSelector, item );
			
			JsMockito.verify( thisSuite.slideModel ).set( 'picture_size', pictureSizeValue );
			JsMockito.verifyNoMoreInteractions( thisSuite.slideModel );
		} );
		
	} );
	
	
	describe( "Test onLayoutChange()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onLayoutChange() should update the slide model's 'layout' attribute with the newly selected item's value", function() {
			var layoutValue = 'left';
			var item = JsMockito.mock( app.components.controls.itemSelector.Item );
			JsMockito.when( item ).getValue().thenReturn( layoutValue );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onLayoutChange( thisSuite.layoutSelector, item );
			
			JsMockito.verify( thisSuite.slideModel ).set( 'layout', layoutValue );
			JsMockito.verifyNoMoreInteractions( thisSuite.slideModel );
		} );
		
	} );
	
	
	describe( "Test onActiveItemIdChange()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = new app.controllers.quark.edit.AbstractSlideshowTest();
			thisSuite.setUp();
		} );
		
		afterEach( function() {
			thisSuite.tearDown();
		} );
		
		
		it( "onActiveItemIdChange() should have the slidesItemSelector select the first slide (the 'title' slide) if provided the empty string for the activeItemId", function() {
			var activeItemId = "";  // for the "title" slide
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onActiveItemIdChange( thisSuite.model, activeItemId );
			
			JsMockito.verify( thisSuite.slidesItemSelector, JsMockito.Verifiers.times( 2 ) ).selectItemAt( 0 );  // should select the first slide (the "title" slide). One invocation comes from the AbstractSlideshow constructor
		} );
		
		
		it( "onActiveItemIdChange() should have the slidesItemSelector select the slide based on the provided activeItemId", function() {
			var activeItemId = 1;
			
			// a non-ModelItem, just to make sure that these are handled
			var extraItem = JsMockito.mock( app.components.controls.itemSelector.Item.extend( { constructor: function(){} } ) );
			
			JsMockito.when( thisSuite.slideModel ).getId().thenReturn( activeItemId );
			JsMockito.when( thisSuite.slidesItemSelector ).getItems().thenReturn( [ extraItem, thisSuite.slideItem ] );
			
			var abstractSlideshow = new thisSuite.AbstractSlideshow( thisSuite.createControllerConfig() );
			abstractSlideshow.onActiveItemIdChange( thisSuite.model, activeItemId );
			
			JsMockito.verify( thisSuite.slidesItemSelector ).select( thisSuite.slideItem );
		} );
		
	} );
	
} );