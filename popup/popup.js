function get_active_tab_hostname(){
    return browser.tabs.query({currentWindow: true, active: true}).then((tab)=> new URL(tab[0].url).hostname)
}

async function get_valid_urls(){
    return (await browser.storage.local.get("valid_urls")).valid_urls
}

function send_command_to_active_tab(command){
    browser.tabs.query({currentWindow: true, active: true}).then((tabs)=> {
        browser.tabs.sendMessage(tabs[0].id, {
            command: command
            }).then(()=> console.log(command,"successfully sent to active tab"))
    })
}




// add the url to the storage on popup click
const toggle_url = document.getElementById("toggle_url");

toggle_url.addEventListener("click", async (e)=>{
    let valid_urls = await get_valid_urls();
    const active_page_hostname = await get_active_tab_hostname();

    let url_index = valid_urls.indexOf(active_page_hostname) //get the index of the hostname
    if(url_index>=0){ // if the hostname is already present, remove it
        valid_urls.splice(url_index, 1);
    }
    else{ //otherwise add it
        valid_urls.push(active_page_hostname)
    }

    // update the store
    await browser.storage.local.set({ valid_urls }).then(()=>console.log(valid_urls,"successfully updated"));

    if(url_index>=0){
        send_command_to_active_tab("deactivate")
    }
    else{
        send_command_to_active_tab("activate")
    }

    window.close() // close the popup
})