function addClass(el,className){if(el&&el.classList)el.classList.add(className);else{if(!el)throw"element must not be null";el.className+=" "+className}}function removeClass(el,className){if(el&&el.classList)el.classList.remove(className);else{if(!el)throw"element must not be null";el.className=el.className.replace(new RegExp("(^|\\b)"+className.split(" ").join("|")+"(\\b|$)","gi")," ")}}function hasClass(el,className){if(el&&el.classList)return el.classList.contains(className);if(el)return new RegExp("(^| )"+className+"( |$)","gi").test(el.className);throw"element must not be null"}function getJsonFromUrl(hashBased){var query=null;if(hashBased){var pos=location.href.indexOf("?");if(-1==pos)return[];query=location.href.substr(pos+1)}else query=location.search.substr(1);var result={};if(!query)throw"Error: attempt to split null string";return query.split("&").forEach(function(part){if(part){var item=part.split("="),key=item[0],from=key.indexOf("[");if(-1==from)result[key]=decodeURIComponent(item[1]);else{var to=key.indexOf("]"),index=key.substring(from+1,to);key=key.substring(0,from),result[key]||(result[key]=[]),index?result[key][index]=item[1]:result[key].push(item[1])}}}),result}function setCookie(cname,cvalue){var exdays=30,d=new Date;d.setTime(d.getTime()+24*exdays*60*60*1e3);var expires="expires="+d.toUTCString();document.cookie=cname+"="+cvalue+"; "+expires}function getCookie(cname){for(var name=cname+"=",ca=document.cookie.split(";"),i=0;i<ca.length;i++){for(var c=ca[i];" "==c.charAt(0);)c=c.substring(1);if(0==c.indexOf(name))return c.substring(name.length,c.length)}return""}function isInputCheckedWithName(name){for(var checked=!1,elements=document.getElementsByName(name),i=0;i<elements.length;i++){var elem=elements[i];elem&&"checked"in elem&&elem.checked&&(checked=!0)}return checked}function inPreviewMode(){var searchString="assignmentId=ASSIGNMENT_ID_NOT_AVAILABLE";return window.location.href.indexOf(searchString)>=0}document.addEventListener("DOMContentLoaded",function(event){if(inPreviewMode())for(var nonHiddenElems=document.querySelectorAll(".visibleInPreview"),i=0;i<nonHiddenElems.length;i++)removeClass(nonHiddenElems[i],"hidden");else for(var hiddenElems=document.querySelectorAll(".hiddenInPreview"),i=0;i<hiddenElems.length;i++)removeClass(hiddenElems[i],"hidden");for(var randomOrderElements=document.querySelectorAll("[random-order]"),x=0;x<randomOrderElements.length;x++){for(var element=randomOrderElements[x],children=element.childNodes,newHTML="",randomIndicies=PubLib.numOfRandomIndiciesWithMaxValue(children.length,children.length),childrenStore=[],j=0;j<children.length;j++){var child=children[j];childrenStore.push(child.outerHTML)}for(var z=0;z<randomIndicies.length;z++){var index=randomIndicies[z],newChild=childrenStore[index];newHTML+=newChild}element.innerHTML=newHTML}});