/**
ctd3

Copyright (c) 2014 Masafumi.OSOGOE

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/

// for JSHint
/* global d3 */
/* exported ctd3 */

/* ================================================================== */
/*  ctd3 definition                                                   */
/* ================================================================== */
var ctd3 = function(){
	"use strict";
	
	var ctd3 = {
		version: "0.0.0"
	};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3 globals                                                      */
	/* ------------------------------------------------------------------ */

	ctd3.instances = {};
	ctd3.get_instance = function(t){
		if(typeof t === "string"){
			// by div id
			return ctd3.instances[t];
		}else{
			// by DOM element
			//return ctd3.instances[d3.select(t.farthestViewportElement).attr("id").replace(/^svg_/g,"")];
			return null;
		}
	};
	
	ctd3.options = {};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3.Table                                                       */
	/* ------------------------------------------------------------------ */
	
	ctd3.Table = function(div_id,dataset,meta){
		this.div_id = div_id;
		ctd3.instances[div_id] = this;
		
		// place holder
		this.dataset_manager = {};
		this.tag_table = {};
		
		this.setup_dataset(dataset,meta);
	};
	
	ctd3.Table.prototype.render = function(options){
		if(!(this.tag_table instanceof ctd3.Parts.TagTable)){
			this.tag_table = new ctd3.Parts.TagTable(this,this.tag_table);
		}
		this.tag_table.render();
	};
	
	ctd3.Table.prototype.setup_dataset = function(dataset,meta){
		if(!(this.dataset_manager instanceof ctd3.DatasetManager)){
			this.dataset_manager = new ctd3.DatasetManager(this,this.dataset_manager);
		}
		this.dataset_manager.setup(dataset,meta)
	};
	
	ctd3.Table.prototype.setup_options = function(options){
		ctd3.Util.merge(this,options);
	};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3.Parts                                                        */
	/* ------------------------------------------------------------------ */
	
	ctd3.Parts = function(table,options){
		this.init(table,options);
	};
	ctd3.Parts.prototype.get_defaults = function(){
		return {}; 
	};
	ctd3.Parts.prototype.init = function(table,options){
		var prop;
		var defaults = this.get_defaults();
		
		this.table = table;
		// copy properties to this
		for(prop in options){
			if(options.hasOwnProperty(prop)){
				this[prop] = options[prop];
			}
		}
		// copy default-properties
		for(prop in defaults){
			if(!this.hasOwnProperty(prop)){
				this[prop] = defaults[prop];
			}
		}
	};
	ctd3.Parts.prototype.render = function(){};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3.Parts.TagTable                                               */
	/* ------------------------------------------------------------------ */

	ctd3.Parts.TagTable = function(){ ctd3.Parts.apply(this,arguments); };
	ctd3.Parts.TagTable.prototype = new ctd3.Parts();
	ctd3.Parts.TagTable.prototype.get_defaults = function(){
		return {
		};
	};
	ctd3.Parts.TagTable.prototype.render = function(){
		var dataset = this.table.dataset_manager.ds_view;
		var meta = this.table.dataset_manager.meta_view;
		var dm = this.table.dataset_manager;
		var that = this;
		
		if(!(this.div)){
			// table
			this.div = d3.select("#"+this.table.div_id).attr("class","ctd3")
				.append("div").attr("class","ctd3_tag_table");
			this.tag_table = this.div.append("table");
			
			// thead
			this.tag_thead = this.tag_table.append("thead");
			this.tag_thead_tr = this.tag_thead.append("tr");
			
			// tbody_data
			this.tag_tbody = this.tag_table.append("tbody").attr("class","ctd3_tbody_data");
		}
		
		/********** scroll_up **********/
		if(dm.can_scroll_up()){
			// data join
			var scroll_up = this.tag_table.selectAll(".ctd3_tbody_scroll_up").data([0]);
			// enter
			scroll_up.enter()
				.insert("tbody",".ctd3_tbody_data").attr("class","ctd3_tbody_scroll_up")
				.append("tr")
				.append("td").attr("colspan",100);
			// update
			scroll_up.select("td").call(this.update_scroll_up_td, this.table);
		}else{
			this.tag_table.select(".ctd3_tbody_scroll_up").remove();
		}
		
		/********** scroll_down **********/
		if(dm.can_scroll_down()){
			// data join
			var scroll_down = this.tag_table.selectAll(".ctd3_tbody_scroll_down").data([0]);
			// enter
			scroll_down.enter()
				.append("tbody").attr("class","ctd3_tbody_scroll_down")
				.append("tr")
				.append("td").attr("colspan",100);
			// update
			scroll_down.select("td").call(this.update_scroll_down_td, this.table);
		}else{
			this.tag_table.select(".ctd3_tbody_scroll_down").remove();
		}
		
		/********** add meta dummy **********/
		if(dm.can_scroll_left()){
			meta.unshift({name:"__scroll_left", __pos:dm.view_fix_col_size - 0.5});
		}
		if(dm.can_scroll_right()){
			meta.push({name:"__scroll_right", __pos:meta.length});
		}
		
		/********** thead **********/
		// data join
		var th = this.tag_thead_tr.selectAll("th.ctd3_th_meta").data(meta,function(d){ return d.name; });
		
		// enter
		th.enter().append("th")
			.each(function(d){
				d3.select(this)
					.html(function(){
						if(!(d.name.substring(0,2) == "__")){
							return d.name
						}else{
							return "";
						}
					})
					.attr("class",function(d){ return "ctd3_th_meta ctd3_th_"+d.name });
			});
		
		// update
		th.sort(function(a,b){ return a.__pos - b.__pos; });
		
		// exit
		th.exit().remove();
		
		
		/********** scroll_right/left **********/
		var tr_scroll = this.tag_tbody.select("tr.ctd3_tr_scroll");
		var td_scroll;
		if(dm.can_scroll_right() || dm.can_scroll_left()){
			if(!(tr_scroll[0][0])){
				tr_scroll = this.tag_tbody.append("tr").attr("class","ctd3_tr_scroll");
			}
			
			// data join
			td_scroll = tr_scroll.selectAll("td.ctd3_td_scroll").data(meta,function(d){ return d.name; });
			
			// enter
			td_scroll.enter()
				.append("td")
				.attr("class","ctd3_td_scroll")
					;
			
			// update
			td_scroll
				.each(function(m,i){
				td = d3.select(this);
				if(m.name == "__scroll_right"){
					td.attr("rowspan",100)
						.call(that.update_scroll_right_td, that.table)
						.attr("class","ctd3_td_scroll ctd3_td_scroll_right");
				}else if(m.name == "__scroll_left"){
					td.attr("rowspan",100)
						.call(that.update_scroll_left_td, that.table)
						.attr("class","ctd3_td_scroll ctd3_td_scroll_left");
				}else{
					td.attr("class","ctd3_td_scroll ctd3_td_empty");
				}
			});
			
			td_scroll.sort(function(a,b){ return a.__pos - b.__pos; });
			
			// exit
			td_scroll.exit().remove();
		}else{
			if(tr_scroll[0][0]){
				tr_scroll.remove();
			}
		}
		
		/********** delete meta dummy **********/
		if(dm.can_scroll_right()){
			meta.pop();
		}
		if(dm.can_scroll_left()){
			meta.shift();
		}


		/********** tbody.tr **********/
		// data join
		var tr = this.tag_tbody.selectAll("tr.ctd3_tr_data").data(dataset,function(d){ return d.__id; });
		
		// enter
		tr.enter()
			.append("tr")
			.attr("class",function(d){ return "ctd3_tr_data ctd3_tr_id_"+d.__id; });
		
		// update
		tr.sort(function(a,b){ return a.__pos - b.__pos; });
		
		// exit
		tr.exit().remove();
		
		
		/********** tbody.tr.td **********/
		var td;
		tr.each(function(row,i){
			// data join
			td = d3.select(this).selectAll("td.ctd3_td_data").data(meta,function(d){ return d.name; });
			
			//enter
			td.enter()
				.append("td")
				.html(function(col,j){
					if(meta[j].text_format !== undefined){
						return meta[j].text_format(row[col.name]);
					}else{
						return row[col.name];
					}
				})
				.attr("class",function(d,j){
					var class_str = (meta[j].css_class)? meta[j].css_class.join(" ") : "";
					return "ctd3_td_data " + ("ctd3_td_"+d.name) + " " + class_str;
				})
				;
			
			// update
			td.sort(function(a,b){ return a.__pos - b.__pos; });
			
			// exit
			td.exit().remove();
		});
		
	};
	ctd3.Parts.TagTable.prototype.update_scroll_up_td = function(td,table){
		var dm = table.dataset_manager;
		if(!(td.select(".ctd3_scroll_up_info")[0][0])){
			td.style("cursor","pointer")
				.on("click",function(){
					table.dataset_manager.scroll_row_view.call(table.dataset_manager,-1*dm.view_row_size);
					table.render();
				})
				.call(function(e){
					td.append("span").html("&#9650; previous page");
					td.append("span").attr("class","ctd3_scroll_up_info").style("font-size","x-small");
				});
		}
		td.select(".ctd3_scroll_up_info")
			.text(function(){
				return " ( now=" + (dm.view_row_cursor+1) + "-" + (dm.view_row_cursor + dm.view_row_size) 
					+ "/ total=" + dm.ds_sorted.length + ")";
			});
	};
	ctd3.Parts.TagTable.prototype.update_scroll_down_td = function(td,table){
		var dm = table.dataset_manager;
		if(!(td.select(".ctd3_scroll_down_info")[0][0])){
			td.style("cursor","pointer")
				.on("click",function(){
					table.dataset_manager.scroll_row_view.call(table.dataset_manager,dm.view_row_size);
					table.render();
				})
				.call(function(td){
					td.append("span").html("&#9660;next page ");
					td.append("span").attr("class","ctd3_scroll_down_info").style("font-size","x-small");
				});
		}
		td.select(".ctd3_scroll_down_info")
			.text(function(){
				return " ( now=" + (dm.view_row_cursor+1) + "-" + (dm.view_row_cursor + dm.view_row_size) 
					+ "/ total=" + dm.ds_sorted.length + ")";
			});
	};
	ctd3.Parts.TagTable.prototype.update_scroll_left_td = function(td,table){
		var dm = table.dataset_manager;
		if(!(td.select(".ctd3_scroll_left_info")[0][0])){
			td.style("cursor","pointer")
				.on("click",function(){
					table.dataset_manager.scroll_col_view
						.call(table.dataset_manager,-1*(dm.view_col_size - dm.view_fix_col_size));
					table.render();
				})
				.call(function(td){
					td.append("span").html("&#9664;");
					td.append("span").attr("class","ctd3_scroll_left_info").style("font-size","small");
				});
		}
		td.select(".ctd3_scroll_left_info")
			.text(function(){
				//return " (" + (dm.view_col_cursor + 1) + "-" + (dm.view_col_cursor + dm.view_col_size - dm.view_fix_col_size) + "/" + dm.meta.length + ")";
				return "";
			});
	};
	ctd3.Parts.TagTable.prototype.update_scroll_right_td = function(td,table){
		var dm = table.dataset_manager;
		if(!(td.select(".ctd3_scroll_right_info")[0][0])){
			td.style("cursor","pointer")
				.on("click",function(){
					table.dataset_manager.scroll_col_view
						.call(table.dataset_manager,(dm.view_col_size - dm.view_fix_col_size));
					table.render();
				})
				.call(function(td){
					td.append("span").html("&#9654;");
					td.append("span").attr("class","ctd3_scroll_right_info").style("font-size","small");
				});
		}
		td.select(".ctd3_scroll_right_info")
			.text(function(){
				//return " (" + (dm.view_col_cursor + 1) + "-" + (dm.view_col_cursor + dm.view_col_size - dm.view_fix_col_size) + "/" + dm.meta.length + ")";
				return "";
			});
	};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3.DatasetManager                                               */
	/* ------------------------------------------------------------------ */
	
	ctd3.DatasetManager = function(table,options){
		this.table = table;
		ctd3.Util.merge(this,this.get_defaults());
		ctd3.Util.merge(this,options);
	};
	ctd3.DatasetManager.prototype.get_defaults = function(){
		return {
			// raw data
			meta: undefined,
			dataset: undefined,
			// processed data
			ds_filtered: undefined,
			ds_sorted: undefined,
			ds_view: undefined,
			meta_view: undefined,
			view_row_cursor: 0,
			view_col_cursor: 0,
			view_row_size: 10,
			view_col_size: 12,
			view_fix_col_size: 2
		};
	};
	ctd3.DatasetManager.prototype.setup = function(dataset,meta){
		if(dataset){
			this.dataset = ctd3.Util.copy(dataset);
		}
		for(var i=0,len=this.dataset.length;i<len;i++){
			this.dataset[i]["__id"] = i; // set unique id
		}
		
		// create meta data if no meta data is set
		if(!(this.meta)){
			var meta = [];
			var sample = this.dataset[0];
			var text_format,css_class;
			for(var key in sample){
				if(sample.hasOwnProperty(key) && !(key.substring(0,2) == "__")){
					css_class = [];
					if(typeof sample[key] == "number"){
						text_format = d3.format(",");
						css_class.push("text_align_right")
					}else{
						text_format = undefined;
					}
					// ignore special data begin width '__'
					meta.push({name:key, text_format:text_format, css_class:css_class});
				}
			}
		}
		this.meta = meta;
		
		this.view_col_cursor = this.view_fix_col_size;
		this.filter_dataset([]);
		this.sort_dataset([]);
		this.reset_view();
	};
	ctd3.DatasetManager.prototype.filter_dataset = function(cond){
		this.ds_filtered = [];
		each_data:
		for(var i=0;i<this.dataset.length;i++){
			for(var j=0;j<cond.length;j++){
				if(!(cond.filter_func(dataset[i][cond[j].name]))){
					continue each_data;
				}
			}
			this.ds_filtered.push(this.dataset[i]);
		}
		return this.ds_filtered;
	};
	ctd3.DatasetManager.prototype.sort_dataset = function(cond){
		this.ds_sorted = [];
		for(var i=0;i<this.ds_filtered.length;i++){
			this.ds_sorted.push(this.ds_filtered[i]);
		}
		
		for(var j=0;j<cond.length;j++){
			this.ds_sorted.sort(cond[j]);
		}
		return this.ds_sorted;
	};
	ctd3.DatasetManager.prototype.reset_view = function(){
		var i;
		this.ds_view = [];
		for(i=0;i<this.view_row_size;i++){
			if(i+this.view_row_cursor < this.ds_sorted.length){
				this.ds_view.push(this.ds_sorted[i+this.view_row_cursor]);
			}else{
				break;
			}
		}
		this.refresh_ds_view_pos();
		
		this.meta_view = [];
		for(i=0;i<this.view_fix_col_size;i++){
			this.meta_view.push(this.meta[i]);
		}
		for(i=0;i<(this.view_col_size - this.view_fix_col_size);i++){
			if(i+this.view_col_cursor < this.meta.length){
				this.meta_view.push(this.meta[i+this.view_col_cursor]);
			}
		}
		this.refresh_meta_view_pos();
	
	};
	ctd3.DatasetManager.prototype.can_scroll_up = function(){
		return (this.view_row_cursor > 0)? true : false;
	};
	ctd3.DatasetManager.prototype.can_scroll_down = function(){
		return (this.view_row_cursor + this.ds_view.length < this.ds_sorted.length)? true : false;
	};
	ctd3.DatasetManager.prototype.scroll_row_view = function(direction){
		var i;
		var row_size = this.ds_view.length;
		var ds_size = this.ds_sorted.length;
		if(direction>0){
			for(i=0;i<direction;i++){
				if(this.view_row_cursor + row_size < ds_size){
					this.ds_view.shift();
					this.view_row_cursor++;
					this.ds_view.push(this.ds_sorted[this.view_row_cursor+row_size-1]);
				}else{
					break;
				}
			}
		}else if(direction<0){
			direction = Math.abs(direction);
			for(i=0;i<direction;i++){
				if(this.view_row_cursor > 0){
					this.ds_view.pop();
					this.view_row_cursor--;
					this.ds_view.unshift(this.ds_sorted[this.view_row_cursor]);
				}else{
					break;
				}
			}
		}
		this.refresh_ds_view_pos();
	};
	ctd3.DatasetManager.prototype.can_scroll_left = function(){
		return (this.view_col_cursor - this.view_fix_col_size > 0)? true : false;
	};
	ctd3.DatasetManager.prototype.can_scroll_right = function(){
		return (this.view_col_cursor + (this.meta_view.length - this.view_fix_col_size) < 
					this.meta.length)? true : false;
	};
	ctd3.DatasetManager.prototype.scroll_col_view = function(direction){
		var i;
		var meta_size = this.meta.length;
		var meta_tmp = [];
		for(i=0;i<this.view_fix_col_size;i++){
			meta_tmp.push(this.meta_view.shift());
		}
		var col_size = this.meta_view.length;
		if(direction>0){
			for(i=0;i<direction;i++){
				if(this.view_col_cursor + col_size < meta_size){
					this.meta_view.shift();
					this.view_col_cursor++;
					this.meta_view.push(this.meta[this.view_col_cursor+col_size-1]);
				}else{
					break;
				}
			}
		}else if(direction<0){
			direction = Math.abs(direction);
			for(i=0;i<direction;i++){
				if(this.view_col_cursor - this.view_fix_col_size > 0){
					this.meta_view.pop();
					this.view_col_cursor--;
					this.meta_view.unshift(this.meta[this.view_col_cursor]);
				}else{
					break;
				}
			}
		}
		for(i=0;i<this.view_fix_col_size;i++){
			this.meta_view.unshift(meta_tmp.pop());
		}
		this.refresh_meta_view_pos();
	};
	ctd3.DatasetManager.prototype.refresh_ds_view_pos = function(){
		for(var i=0,len=this.ds_view.length;i<len;i++){
			this.ds_view[i]["__pos"] = i;
		}
	};
	ctd3.DatasetManager.prototype.refresh_meta_view_pos = function(){
		for(var i=0,len=this.meta_view.length;i<len;i++){
			this.meta_view[i]["__pos"] = i;
		}
	};

	/* ------------------------------------------------------------------ */
	/*  ctd3.Util                                                         */
	/* ------------------------------------------------------------------ */
	ctd3.Util = {};
	/**
	* merge object(overwrite properties)
	* thanks to https://gist.github.com/ww24/2181560
	*/
	ctd3.Util.merge = function(a,b){
		for (var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = (key in a) ? 
					((typeof a[key] === "object" && typeof b[key] === "object") ?
						ctd3.Util.merge(a[key], b[key]) : b[key]) : b[key];
			}
		}
		return a;
	};
	ctd3.Util.copy = function(obj){
		// deep copy dataset and so on.
		if (null === obj || undefined === obj || "object" != typeof obj) return obj;
		var copy;
		
		if (obj instanceof Date) {
			copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}
		if (obj instanceof Array) {
			copy = [];
			for (var i = 0, len = obj.length; i < len; i++) {
				copy[i] = ctd3.Util.copy(obj[i]);
			}
			return copy;
		}
		if (obj instanceof Object) {
			copy = {};
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = ctd3.Util.copy(obj[attr]);
			}
			return copy;
		}
		
		throw new Error("Unable to copy obj! Its type isn't supported.");
	};


	return ctd3;
}();
