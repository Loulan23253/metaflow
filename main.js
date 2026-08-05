const {
    Plugin,
    PluginSettingTab,
    Setting,
    TFile
} = require("obsidian");


const DEFAULT_SETTINGS = {

    rules:[
        {
            folder:"Agenda",
            properties:{
                type:"calendar",
                source:"ogenda",
                tags:["calendar"]
            }
        }
    ]

};





module.exports = class MetaFlow extends Plugin {


async onload(){

    await this.loadSettings();


    this.addSettingTab(
        new MetaFlowSettingTab(
            this.app,
            this
        )
    );



    this.registerEvent(

        this.app.vault.on(
            "create",
            file=>{


                if(!(file instanceof TFile))
                    return;


                if(!file.path.endsWith(".md"))
                    return;


                setTimeout(
                    ()=>{
                        this.handleFile(file);
                    },
                    800
                );


            }
        )

    );

}



async handleFile(file){


    for(
        const rule of this.settings.rules
    ){


        if(
            !file.path.startsWith(rule.folder)
        )
            continue;



        await this.addMeta(
            file,
            rule.properties
        );


    }


}






async addMeta(
    file,
    properties
){


    await this.app.fileManager.processFrontMatter(
        file,
        frontmatter=>{


            for(
                const [key,value]
                of Object.entries(properties)
            ){

                frontmatter[key]=value;

            }


        }
    );


}







async loadSettings(){

    this.settings =
    Object.assign(
        {},
        DEFAULT_SETTINGS,
        await this.loadData()
    );


}






async saveSettings(){

    await this.saveData(
        this.settings
    );

}


};









class MetaFlowSettingTab
extends PluginSettingTab {



constructor(app,plugin){

    super(app,plugin);

    this.plugin=plugin;

}





display(){


const {
    containerEl
}=this;


containerEl.empty();



containerEl.createEl(
"h2",
{
text:"MetaFlow"
}
);




// 顶部新增规则


new Setting(containerEl)

.addButton(
btn=>{


btn

.setButtonText(
"+ 新增规则"
)


.onClick(
async()=>{


let rule={

folder:"",
properties:{}

};



this.plugin.settings.rules.push(
rule
);



await this.plugin.saveSettings();



this.createRule(
rule,
this.plugin.settings.rules.length-1,
containerEl
);



}

);


}

);






this.plugin.settings.rules
.forEach(
(rule,index)=>{


this.createRule(
rule,
index,
containerEl
);


}

);



}









createRule(
rule,
index,
container
){



const box =
container.createDiv();



box.style.border =
"1px solid var(--background-modifier-border)";


box.style.borderRadius =
"10px";


box.style.padding =
"10px";


box.style.marginBottom =
"12px";







// 标题栏


const header =
box.createDiv();



header.style.cursor =
"pointer";


header.style.display =
"flex";


header.style.alignItems =
"center";





const arrow =
header.createSpan(
{
text:"▼"
}
);


arrow.style.marginRight =
"8px";





const title =
header.createEl(
"b",
{
text:
rule.folder
?
`📁 ${rule.folder}`
:
"📁 新规则"
}
);






const content =
box.createDiv();



content.style.marginTop =
"10px";





let opened=true;



header.onclick=()=>{


opened=!opened;


content.style.display =
opened
?
"block"
:
"none";


arrow.textContent =
opened
?
"▼"
:
"▶";


};






// 文件夹选择


new Setting(content)

.setName(
"监听文件夹"
)

.addDropdown(
dropdown=>{


dropdown.addOptions(
this.getFolders()
);



dropdown.setValue(
rule.folder
);



dropdown.onChange(
async value=>{


rule.folder=value;



title.textContent =
value
?
`📁 ${value}`
:
"📁 新规则";



await this.plugin.saveSettings();


}

);


}

);
// Properties区域


const propertyBox =
content.createDiv();





const renderProperties=()=>{


propertyBox.empty();



propertyBox.createEl(
"h3",
{
text:"Properties"
}
);





Object.entries(
rule.properties
)

.forEach(
([key,value])=>{


this.createProperty(
rule,
key,
value,
propertyBox,
renderProperties
);


}

);



};



renderProperties();








// 添加 Property


new Setting(content)

.addButton(
btn=>{


btn

.setButtonText(
"+ 添加 Property"
)


.onClick(
async()=>{


rule.properties["new"]="";


await this.plugin.saveSettings();


renderProperties();


}

);


}

);








// 删除规则


new Setting(content)

.addButton(
btn=>{


btn

.setButtonText(
"删除规则"
)


.onClick(
async()=>{


this.plugin.settings.rules.splice(
index,
1
);



await this.plugin.saveSettings();



box.remove();


}

);


}

);



}









createProperty(
rule,
key,
value,
container,
refresh
){



let row =
new Setting(container);



let keyInput;





row.addText(
text=>{


keyInput=text;


text

.setValue(
key
)

.setPlaceholder(
"key"
);


}

);







row.addText(
text=>{


text

.setValue(
Array.isArray(value)
?
value.join(",")
:
String(value)
)


.setPlaceholder(
"value"
)


.onChange(
async val=>{


rule.properties[key]=

val.includes(",")
?
val.split(",")
:
val;



await this.plugin.saveSettings();


}

);


}

);









// 保存 Key


row.addButton(
btn=>{


btn

.setButtonText(
"保存"
)


.onClick(
async()=>{


let newKey =
keyInput.getValue();



if(
newKey &&
newKey!==key
){


let old =
rule.properties[key];


delete rule.properties[key];


rule.properties[newKey]=old;



await this.plugin.saveSettings();



refresh();


}


}

);


}

);








// 删除 Property


row.addButton(
btn=>{


btn

.setButtonText(
"删除"
)


.onClick(
async()=>{


delete rule.properties[key];


await this.plugin.saveSettings();



refresh();


}

);


}

);



}









getFolders(){


let folders={};



this.app.vault
.getAllLoadedFiles()
.forEach(
file=>{


if(file.children){

folders[file.path]=file.path;

}


}

);



return folders;


}


}