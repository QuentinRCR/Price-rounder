// doesn't work on manomano

// add a fraction to the price if it exists
function return_amazon_fraction(priceContainer){
    return "," + 
    (Array.from(priceContainer.childNodes).some(node => node.classList.contains('a-price-fraction')) //check is some children have the class
     ? priceContainer.getElementsByClassName('a-price-fraction')[0].textContent
     : "")
}

// round the price following some rules 
function roundPrice(price) {
    // For prices over 200, round to the nearest ten if the units are more that 4.9 (295€ => 300€)
    if (price > 200 && price % 10 > 4.9) {
        price = Math.ceil(price / 10) * 10;
    }
    
    // For prices over 80, round to the nearest ten if the units are close to rounding up (88€ => 90€)
    else if (price > 80 && price % 10 > 7) {
        price = Math.ceil(price / 10) * 10;
    }

    // Round to the nearest whole number if cents are >= 0.85
    else if (price % 1 >= 0.85) {
        price = Math.round(price);
    }

    // Round to the nearest 0.1 if cents in tenths place are close to rounding up (e.g., 4.49 to 4.50)
    else if (price % 0.1 > 0.089) {
        price = Number(price.toFixed(1));
    }

    return price;
}

// Helper function to format and replace a price string
function formatPrice(price, currencySymbolsRegex) {
    const currencyMatch = price.match(currencySymbolsRegex);
    const currency = currencyMatch[0];
    const currencyFirst = currencyMatch.index === 0; //if the currency is a the beginning, it index is zero

    let formattedPrice = price.replace(currency, '').replace(/\s+/g, ''); // remove the currency to round the price up
    const useComma = formattedPrice.includes(',');

    useComma && (formattedPrice = formattedPrice.replace(',', '.')); // Replace comma with period for parsing

    let roundedPrice = roundPrice(Number(formattedPrice)).toFixed(2); //round price and convert back to 2 decimal

    useComma && (roundedPrice = roundedPrice.replace('.', ',')); // Revert period to comma if original had comma

    return currencyFirst ? currency + roundedPrice : roundedPrice + currency;
}

const processElements = (elements) => {
    const valuePattern = `(\\d\\s*?){1,6}([.,]\\d{1,2})?`; //matches 22.90, 22.9, 22.9, 22, 22, 1000, 100 000, 100 000.02
    const currencySymbolsRegex = `([€$£¥₹₩₽₺₪₦৳₱₨৳]|zł|CHF|د.إ|USD|EUR)`; // match any possible currency
    const pricePattern = new RegExp(`(${valuePattern}\\s?${currencySymbolsRegex})|(${currencySymbolsRegex}\\s?${valuePattern})`,'g');

    // const pricePattern = /\s?[€$£¥]/g; //matches 22.90 €, 22.9 €, 22.9€, 22€, 22 € 1000€ 100 000€ 100 000.02€

    elements.forEach(element => {
        //regular price
        let target_node = null;
        if(element.children.length <= 1){ // For elements close to the root
            target_node = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE); //get the content written in the element
        }
        const matchedPrices = target_node?.nodeValue.match(pricePattern); // try to match a price
        if (matchedPrices) {
            matchedPrices?.forEach(price => {
                const formattedPrice = formatPrice(price, currencySymbolsRegex); //format it
                target_node.nodeValue = target_node.nodeValue.replace(price, formattedPrice);
            });
        }

        // handle amazon weird price display
        else if(element.classList.contains('a-price')){
            let priceContainer = element.querySelector('span[aria-hidden="true"]');
            if (priceContainer.children.length > 0){ // ignore simple prices that were already handled by the first case  
                const priceText = element.getElementsByClassName('a-offscreen')[0].textContent
                let formattedPrice;
                if(priceText.match(pricePattern)){ // use the off screen price when it exist
                    formattedPrice = formatPrice(priceText, currencySymbolsRegex);
                }
                else{ //otherwise reconstruct the price
                    let priceText = (priceContainer.getElementsByClassName('a-price-whole')[0].textContent.replace(/\s+/g, '') +
                                    return_amazon_fraction(priceContainer)).replaceAll(",",".").replace('..','.') + priceContainer.getElementsByClassName('a-price-symbol')[0].textContent;
                    formattedPrice = formatPrice(priceText, currencySymbolsRegex);
                }
                priceContainer.innerHTML = formattedPrice;
                
                //reconstruct the price from amazon weird price display

                // let roundedPrice = roundPrice(Number(priceText)); // Round the price
                // priceContainer.innerHTML = roundedPrice.toFixed(2).replace(".", ",") + '€' // replace the complicated spans with some texts
            }
        }
    });
}



function get_active_tab_hostname(){
    return new URL(window.location.href).hostname
}

async function get_valid_urls(){
    return (await browser.storage.local.get("valid_urls")).valid_urls || [];
}

// initialism the extension
async function initialize(force){
    let valid_urls = await get_valid_urls();
    const active_page_hostname = await get_active_tab_hostname();

    if(valid_urls.includes(active_page_hostname) || force){ // if the extension have to be run on the page, initialize everything 
        console.log("The rounding has been initialized")

        // Initialization
        initialRounding = () => processElements(queryAllDeep("*"));

        if (document.readyState !== 'loading') {
            // document is already ready, just execute code here
            initialRounding();
        } else {
            // if the doc is not ready, execute the extension once the entire DOM is ready 
            document.addEventListener('DOMContentLoaded', function () {
                initialRounding();
            });
        }


        // Handle DOM changes
        const observer = new MutationObserver(handleNewNodes);

        // Start observing the body for child additions
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// perform this operation every time the dom is updated
function handleNewNodes(mutations) {
    const addedElements = []; // Array to store all added elements

    mutations.forEach(mutation => {
        // Check for added nodes in the mutation
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) { // Only consider element nodes
                addedElements.push(node); // Add the element itself
                
                // Add all subtree elements as well
                queryAllDeep('*',node).forEach(subNode => {
                    addedElements.push(subNode);
                });
            }
        });
    });

    processElements(addedElements);
}


console.log("The extension is running");
initialize(false) // initialization on page load


// React to messages from the popup
function handleMessage(request, sender, sendResponse) {
    if(request.command === "activate"){ // force activate the extension
        console.log("Activating the extension")
        initialize(true); //force the initialization 
    }
    else if (request.command === "deactivate"){ //reload the page to get ride of the rounded elements 
        console.log("Deactivating the extension")
        location.reload()
    }
    else{
        console.warn("The command",request.command,"from",sender,"was received but not handled");
    }
}

browser.runtime.onMessage.addListener(handleMessage);

// query all elements, including shadow ones
function queryAllDeep(selector, root = document) {
    const elements = Array.from(root.querySelectorAll(selector));

    // Recursively search for the selector in each shadow root
    root.querySelectorAll("*").forEach((element) => {
        if (element.shadowRoot) {
            elements.push(...queryAllDeep(selector, element.shadowRoot));
        }
    });

    return elements;
}