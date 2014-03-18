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
	
	ctd3.Table = function(div_id,dataset){
		this.div_id = div_id;
		ctd3.instances[div_id] = this;
		
		// place holder
		this.dataset_manager = {};
		this.tag_table = {};
		this.dataset = {};
		this.meta = [];
		
		this.init_dataset(dataset);
	};
	ctd3.Table.prototype.init_dataset = function(dataset){
		if(!(this.dataset_manager instanceof ctd3.DatasetManager)){
			this.dataset_manager = new ctd3.DatasetManager(this,this.dataset_manager);
			this.dm = this.dataset_manager; // alias for dataset_manager
		}
		this.dataset = this.dataset_manager.setup_dataset(dataset); // alias for dataset_manager.dataset
		this.meta = this.dataset_manager.create_default_meta(); // alias for dataset_manager.meta
		this.dm.view_col_cursor = this.dm.view_fix_col_size;
	};
	ctd3.Table.prototype.setup_meta = function(meta){
		this.dataset_manager.setup_meta(meta);
		this.dataset_manager.sort_meta();
	};
	ctd3.Table.prototype.setup_dm_options = function(options){
		ctd3.Util.merge(this.dataset_manager,options);
		this.dm.view_col_cursor = this.dm.view_fix_col_size;
	};
	ctd3.Table.prototype.render = function(cond){
		if(!(this.tag_table instanceof ctd3.Parts.TagTable)){
			this.tag_table = new ctd3.Parts.TagTable(this,this.tag_table);
		}
		if(cond == undefined){ cond = {}; }
		if(!(cond.table_render_only)){
			//this.dataset_manager.sort_meta();
			if(!(cond.skip_filter_dataset)){
				this.dataset_manager.filter_dataset();
			}
			this.dataset_manager.sort_dataset();
			this.dataset_manager.reset_view();
		}
		this.tag_table.render();
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
		
		/********** initialize **********/
		if(!(this.div)){
			// table
			this.div = d3.select("#"+this.table.div_id).attr("class","ctd3")
				.append("div").attr("class","ctd3_tag_table");
			this.tag_table = this.div.append("table");
			
			// thead
			this.tag_thead = this.tag_table.append("thead");
			this.tag_thead_tr_label = this.tag_thead.append("tr");
			this.tag_thead_tr_filter = this.tag_thead.append("tr");
			
			// tbody_data
			this.tag_tbody = this.tag_table.append("tbody").attr("class","ctd3_tbody_data");
			
			// tfoot
			this.tag_tfoot = this.tag_table.append("tfoot");
			this.tag_tfoot_div = this.tag_tfoot
				.append("tr")
				.append("th").attr("colspan",meta.length+2)
				.append("div").attr("class","ctd3_tfoot_div");
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
				.insert("tbody","tfoot").attr("class","ctd3_tbody_scroll_down")
				.append("tr")
				.append("td").attr("colspan",100);
			// update
			scroll_down.select("td").call(this.update_scroll_down_td, this.table);
		}else{
			this.tag_table.select(".ctd3_tbody_scroll_down").remove();
		}
		
		/********** add meta dummy for scroll_left/right **********/
		if(dataset.length>0){
			if(dm.can_scroll_left()){
				meta.unshift({name:"__scroll_left", __pos:dm.view_fix_col_size - 0.5});
			}
			if(dm.can_scroll_right()){
				meta.push({name:"__scroll_right", __pos:meta.length});
			}
		}
		
		/********** thead label **********/
		// data join
		var th = this.tag_thead_tr_label.selectAll("th.ctd3_th_label").data(meta,function(d){ return d.name; });
		
		// enter
		th.enter().append("th")
			.each(function(d){
				d3.select(this)
					.attr("class",function(d){ return "ctd3_th_label ctd3_th_"+d.name })
					.attr("style","cursor:pointer;")
					.on("click",function(meta){
						var dm = that.table.dataset_manager;
						var metas = dm.meta;

						if(meta.sort == "asc"){
							meta.sort = undefined;
						}else if(meta.sort == "desc"){
							meta.sort = "asc";
						}else{
							meta.sort = "desc";
						}
						for(var i=0;i<metas.length;i++){
							if(metas[i].name !== meta.name){
								metas[i].sort = null;
							}
						}
						dm.view_row_cursor = 0;
						that.table.render({skip_filter_dataset:true});
					})
					.append("div")
					.attr("class",function(){
						return (d.name.substring(0,2) == "__")? null:"ctd3_cell_div";
					})
					.style("width",function(d,j){
						return (d.width)? d.width : null;
					})
					;
			});
		
		// update
		th.each(function(d){
			d3.select(this).select("div")
				.html(function(){
					if(d.name.substring(0,2) == "__"){
						return "";
					}
					var html = (d.label !== undefined)? d.label : d.name;
					if(d.sort == "asc"){
						html += "<span style='font-size:x-small;'>&#9650;</span>";
					}else if(d.sort == "desc"){
						html += "<span style='font-size:x-small;'>&#9660;</span>";
					}
					return html;
				});
			
		});
		th.sort(function(a,b){ return a.__pos - b.__pos; });
		
		// exit
		th.exit().remove();
		
		/********** thead filter **********/
		if(dm.show_filter_form){
			// data join
			var th = this.tag_thead_tr_filter.selectAll("th.ctd3_th_filter").data(meta,function(d){ return d.name; });
			
			// enter
			th.enter().append("th")
				.each(function(d){
					var td = d3.select(this);
					var div = td.attr("class",function(d){ return "ctd3_th_filter ctd3_th_"+d.name })
						.append("div")
						.attr("class",function(){
							return (d.name.substring(0,2) == "__")? null:"ctd3_cell_div";
						})
						.style("width",function(d,j){
							return (d.width)? d.width : null;
						});
					that.create_filter_form(div, d);
				});
			
			// update
			th.sort(function(a,b){ return a.__pos - b.__pos; });
			
			// exit
			th.exit().remove();
		}
	
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
		if(dataset.length>0){
			if(dm.can_scroll_right()){
				meta.pop();
			}
			if(dm.can_scroll_left()){
				meta.shift();
			}
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
				.html(function(d,j){
					var html = row[d.name];
					if(meta[j].text_format !== undefined){
						html =  meta[j].text_format(html,meta[j]);
					}
					if(meta[j].html_format !== undefined){
						html = meta[j].html_format(html,meta[j],row[d.name]);
					}else{
						html = "<div>" + html + "</div>";
					}
					return html;
				})
				.attr("class",function(d,j){
					var class_str = (meta[j].css_class)? meta[j].css_class.join(" ") : "";
					return "ctd3_td_data " + ("ctd3_td_"+d.name) + " " + class_str;
				})
				.attr("style",function(d,j){
					if(meta[j].td_style !== undefined){
						return meta[j].td_style(meta[j],row[d.name]);
					}
					return null;
				})
				.select("div").attr("class","ctd3_cell_div")
				.style("width",function(d,j){
					return (meta[j].width)? meta[j].width : null;
				})
				;
			
			// update
			td.sort(function(a,b){ return a.__pos - b.__pos; });
			
			// exit
			td.exit().remove();
		});
		
		/********** tbody.tr.td for empty dataset **********/
		if(dataset.length == 0){
			if(this.tag_tbody.select("tr.ctd3_tr_empty_dataset")[0][0] == null){
				this.tag_tbody
					.append("tr").attr("class","ctd3_tr_empty_dataset")
					.append("td").attr("colspan",meta.length)
					.append("div").attr("class","ctd3_div_empty_dataset")
						.text("no data found");
			}
		}else{
			this.tag_tbody.select("tr.ctd3_tr_empty_dataset").remove();
		}
		
		/********** tfoot **********/
		this.tag_tfoot_div.select("*").remove();
		this.tag_tfoot_div
			.call(function(div){
				div.append("span")
					.text(function(){
						var html = "";
						html += "shown=" + (dm.view_row_cursor+1) + "-" + (dm.view_row_cursor + dataset.length);
						html += " / ";
						html += "filtered=" + dm.ds_sorted.length;
						html += " / ";
						html += "overall=" + dm.dataset.length;
						return html;
					})
			});

	};
	ctd3.Parts.TagTable.prototype.create_filter_form = function(div,meta){
		var that = this;
		var dm = this.table.dataset_manager;
		
		if(meta.name.substring(0,2) == "__"){ return; }
		if(meta.filter_type == "text"){
			div.html(function(){
					var value = (meta.filter_value !== undefined)? "value='"+meta.filter_value+"'" : "";
					var html = "<input type='text' name='"+meta.name+"' "+value+" />"
					return html;
				})
				.select("input")
				.on("keyup",function(meta){
					var value = d3.select(this).property("value");
					var dm = that.table.dataset_manager;
					if(value !== ""){
						meta.filter_value = value;
					}else{
						meta.filter_value = undefined;
					}
					dm.view_row_cursor = 0;
					that.table.render();
				});
		}else if(meta.filter_type == "select"){
			var select = div.append("select");
			select.call(function(){
					var list = [],i,len;
					for(i=0,len=dm.dataset.length;i<len;i++){
						if(list.indexOf(dm.dataset[i][meta.name]) == -1){
							list.push(dm.dataset[i][meta.name]);
						}
					}
					select.append("option").attr("value","").text("-");
					for(i=0,len=list.length;i<len;i++){
						select.append("option").attr("value",list[i]).text(list[i])
							.attr("selected",function(){
								return (meta.filter_value == list[i])? "" : null;
							});
					}
				})
				.on("change",function(meta){
					var value = d3.select(this).property("value");
					var dm = that.table.dataset_manager;
					if(value !== ""){
						meta.filter_value = value;
					}else{
						meta.filter_value = undefined;
					}
					dm.view_row_cursor = 0;
					that.table.render();
				});
		}
	};
	ctd3.Parts.TagTable.prototype.update_scroll_up_td = function(td,table){
		var dm = table.dataset_manager;
		if(!(td.select(".ctd3_scroll_up_div")[0][0])){
			td.style("cursor","pointer")
				.on("click",function(){
					table.dataset_manager.scroll_row_view.call(table.dataset_manager,-1*dm.view_row_size);
					table.render({table_render_only:true});
				})
				.append("div").attr("class","ctd3_scroll_up_div")
				.append("span").html("&#9650; previous page");
		}
	};
	ctd3.Parts.TagTable.prototype.update_scroll_down_td = function(td,table){
		var dm = table.dataset_manager;
		if(!(td.select(".ctd3_scroll_down_div")[0][0])){
			td.style("cursor","pointer")
				.on("click",function(){
					table.dataset_manager.scroll_row_view.call(table.dataset_manager,dm.view_row_size);
					table.render({table_render_only:true});
				})
				.append("div").attr("class","ctd3_scroll_down_div")
				.append("span").html("&#9660;next page ");
		}
	};
	ctd3.Parts.TagTable.prototype.update_scroll_left_td = function(td,table){
		var dm = table.dataset_manager;
		if(!(td.select(".ctd3_scroll_left_div")[0][0])){
			td.style("cursor","pointer")
				.on("click",function(){
					table.dataset_manager.scroll_col_view
						.call(table.dataset_manager,-1*(dm.view_col_size - dm.view_fix_col_size));
					table.render({table_render_only:true});
				})
				.append("div").attr("class","ctd3_scroll_left_div")
				.append("span").html("&#9664;");
		}
	};
	ctd3.Parts.TagTable.prototype.update_scroll_right_td = function(td,table){
		var dm = table.dataset_manager;
		if(!(td.select(".ctd3_scroll_right_div")[0][0])){
			td.style("cursor","pointer")
				.on("click",function(){
					table.dataset_manager.scroll_col_view
						.call(table.dataset_manager,(dm.view_col_size - dm.view_fix_col_size));
					table.render({table_render_only:true});
				})
				.append("div").attr("class","ctd3_scroll_right_div")
				.append("span").html("&#9654;");
		}
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
			// options
			view_row_cursor: 0,
			view_col_cursor: 0,
			view_row_size: 10,
			view_col_size: 12,
			view_fix_col_size: 2,
			show_filter_form: true
		};
	};
	ctd3.DatasetManager.prototype.setup_dataset = function(dataset){
		if(dataset){
			this.dataset = ctd3.Util.copy(dataset);
		}
		for(var i=0,len=this.dataset.length;i<len;i++){
			this.dataset[i]["__id"] = i; // set unique id
		}
		return this.dataset;
	};
	ctd3.DatasetManager.prototype.create_default_meta = function(){
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
				meta.push({name:key, text_format:text_format, css_class:css_class, filter_type:"text"});
			}
		}
		this.meta = meta;
		return this.meta;
	};
	ctd3.DatasetManager.prototype.setup_meta = function(meta){
		for(var i=0,len=this.meta.length;i<len;i++){
			if(meta.hasOwnProperty(this.meta[i].name)){
				ctd3.Util.merge(this.meta[i], meta[this.meta[i].name]);
			}
		}
	};
	ctd3.DatasetManager.prototype.sort_meta = function(){
		this.meta.sort(function(a,b){
			var av = (a.order === undefined)? 999999 : a.order;
			var bv = (b.order === undefined)? 999999 : b.order;
			if(av > bv){ return 1; }
			if(av < bv){ return -1; }
			return 0;
		});
	};
	ctd3.DatasetManager.prototype.enable_incell_visualize = function(name,type){
		var pos;
		for(var i=0,len=this.meta.length;i<len;i++){
			if(this.meta[i].name == name){
				pos = i;
			}
		}
		if(pos === undefined){ return; }
		
		if(type === undefined){ type = "bar"; }; // default
		
		var that = this;
		var extent = d3.extent(this.dataset, function(d){
			return d[that.meta[pos].name]; 
		});
		
		if(type == "bar"){
			this.meta[pos].scale = d3.scale.linear().range([0,100]).domain(extent);
			this.meta[pos].html_format = function(text,meta,val){
				return "<div style='position:relative;'><div style='background-color:lightblue;position:absolute;z-index:1;height:100%;width:" + meta.scale(val) + "%;'> </div><div style='position:relative;z-index:2;'>" + text + "</div></div>";
			};
		}else if(type == "gradation"){
			this.meta[pos].scale = d3.scale.linear().range(["green","red"]).domain(extent)
				.interpolate(d3.interpolateHsl);
			this.meta[pos].html_format = function(text,meta,val){
				return "<div>" + text + "</div>";
			};
			this.meta[pos].td_style = function(meta,val){
				return "background-color:" + meta.scale(val) + ";";
			};

		}
	};
	ctd3.DatasetManager.prototype.filter_dataset = function(){
		var cond = [],i,j,meta;
		for(i=0;i<this.meta.length;i++){
			if(this.meta[i].filter_value !== undefined){
				meta = this.meta[i];
				if(meta.filter_type == "text" && meta.filter_value !== undefined){
					cond.push(function(d){
						var values = this.filter_value.split(" ");
						for(var j=0;j<values.length;j++){
							if(values[j].indexOf("<=") == 0 || values[j].indexOf("=<") == 0){
								if(!(1.0*d[this.name] <= 1.0*values[j].replace("<","").replace("=",""))){ return false; }
							}else if(values[j].indexOf(">=") == 0 || values[j].indexOf("=>") == 0){
								if(!(1.0*d[this.name] >= 1.0*values[j].replace(">","").replace("=",""))){ return false; }
							}else if(values[j].indexOf("<") == 0){
								if(!(1.0*d[this.name] < 1.0*values[j].replace("<",""))){ return false; }
							}else if(values[j].indexOf(">") == 0){
								if(!(1.0*d[this.name] > 1.0*values[j].replace(">",""))){ return false; }
							}else if(values[j].indexOf("=") == 0){
								if(!(""+d[this.name] == values[j].replace("=",""))){ return false; }
							}else{
								if((""+d[this.name]).indexOf(""+values[j]) == -1){ return false; }
							}
						}
						return true;
					}.bind(meta));
				}else if(meta.filter_type == "select" && meta.filter_value !== undefined){
					cond.push(function(d){
						return (""+d[this.name] == ""+this.filter_value);
					}.bind(meta));

				}
			}
		}
		
		this.ds_filtered = [];
		each_data:
		for(i=0;i<this.dataset.length;i++){
			for(j=0;j<cond.length;j++){
				if(!(cond[j](this.dataset[i]))){
					continue each_data;
				}
			}
			this.ds_filtered.push(this.dataset[i]);
		}
		return this.ds_filtered;
	};
	ctd3.DatasetManager.prototype.sort_dataset = function(){
		var i,j,cond = [];
		this.ds_sorted = [];
		for(i=0;i<this.ds_filtered.length;i++){
			this.ds_sorted.push(this.ds_filtered[i]);
		}
		for(i=0;i<this.meta.length;i++){
			if(this.meta[i].sort == "asc"){
				cond.push(function(a,b){
					var av = a[this.name];
					var bv = b[this.name];
					if(av > bv){ return 1; }
					if(av < bv){ return -1; }
					return 0;
				}.bind(this.meta[i]));
			}else if(this.meta[i].sort == "desc"){
					cond.push(function(a,b){
					var av = a[this.name];
					var bv = b[this.name];
					if(av > bv){ return -1; }
					if(av < bv){ return 1; }
					return 0;
				}.bind(this.meta[i]));
			}
		}
		for(i=0;i<cond.length;i++){
			this.ds_sorted.sort(cond[i]);
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
		return (this.view_col_cursor + (this.view_col_size - this.view_fix_col_size) < 
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
