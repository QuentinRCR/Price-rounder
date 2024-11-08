// doesn't work on manomano, bonlanger, ebay

const processElements = (elements) => {
    const valuePattern = `(\\d\\s*?){1,6}([.,]\\d{1,2})?`; //matches 22.90, 22.9, 22.9, 22, 22, 1000, 100 000, 100 000.02
    const currencySymbolsRegex = `([€$£¥₹₩₽₺₪₦৳₱₨৳]|zł|CHF|د.إ|USD|EUR)`; // match any possible currency
    const pricePattern = new RegExp(`(${valuePattern}\\s?${currencySymbolsRegex})|(${currencySymbolsRegex}\\s?${valuePattern})`,'g');

    // const pricePattern = /\s?[€$£¥]/g; //matches 22.90 €, 22.9 €, 22.9€, 22€, 22 € 1000€ 100 000€ 100 000.02€

    elements.forEach(element => {
        // For elements without children
        if (element.children.length==0 && element.textContent.match(pricePattern)) {

            let prices = element.textContent.match(pricePattern);


            prices.forEach(price => {
                console.log("1-",price)
                const currency_match = price.match(currencySymbolsRegex)
                const currency = currency_match[0]
                const currency_first = currency_match.index==0 //if the currency is a the beginning, it index is zero

                const useComma = price.includes(','); // if the price is written with a comma
                let originalPrice = price.replace(currency, '').replace(/\s+/g, ''); // Remove the currency and all white spaces

                if (useComma){
                    originalPrice = originalPrice.replace(',', '.');  //replace , with .
                }  

                let roundedPrice = roundPrice(Number(originalPrice)); // Round the price

                let textPrice  = roundedPrice.toFixed(2); //add two decimals

                if (useComma){
                    textPrice = textPrice.replace(".", ",")
                }

                if(currency_first){
                    textPrice = currency+textPrice;
                }
                else{
                    textPrice += currency; // add the currency symbol back
                }

                // Replace the original price in the element's text content
                element.textContent = element.textContent.replace(price, textPrice);
            });
        }
        // If the element has child elements, we need a more complex approach
        else if (element.classList.contains('product-price__price')) { //a bit specific for darty
            // Find the price text
            let priceTexts = element.firstChild.data.match(pricePattern);
            
            priceTexts.forEach((priceText)=>{
                console.log("2-",priceText)
                const currency_match = price.match(currencySymbolsRegex)
                const currency = currency_match[0]
                const currency_first = currency_match.index==0 //if the currency is a the beginning, it index is zero

                let originalPrice = priceText.replace(currency, '').replace(',', '.').replace(/\s+/g, '');

                let roundedPrice = roundPrice(Number(originalPrice)); // Round the price

                let returnPrice  = roundedPrice.toFixed(2).replace(".", ","); //add two decimals

                if(currency_first){
                    returnPrice = currency+returnPrice;
                }
                else{
                    returnPrice += currency; // add the currency symbol back
                }

                // Replace the original price in the element's text content
                element.firstChild.data = element.firstChild.data.replace(priceText, returnPrice);
            })
        }

        // handle amazon weird price display
        else if(element.classList.contains('a-price')){
            let priceContainer = element.querySelector('span[aria-hidden="true"]');
            if (priceContainer.children.length > 0){ // ignore simple prices that were already handled by the first case            
                //reconstruct the price from amazon weird price display
                let priceText = (priceContainer.getElementsByClassName('a-price-whole')[0].textContent.replace(/\s+/g, '') +
                                return_amazon_fraction(priceContainer)).replace(",",".").replace('..','.');
                let roundedPrice = roundPrice(Number(priceText)); // Round the price
                priceContainer.innerHTML = roundedPrice.toFixed(2).replace(".", ",") + '€' // replace the complicated spans with some texts
            }
        }
    });
}

// add a fraction to the price if it exists
function return_amazon_fraction(priceContainer){
    return "," + 
    (Array.from(priceContainer.childNodes).some(node => node.classList.contains('a-price-fraction')) //check is some children have the class
     ? priceContainer.getElementsByClassName('a-price-fraction')[0].textContent
     : "")
}

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
        initialRounding = () => processElements(document.querySelectorAll("body *"));

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
                node.querySelectorAll('*').forEach(subNode => {
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
