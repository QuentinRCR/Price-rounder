const processElements = (elements) => {
    const pricePattern = /(\d\s*?){1,6}((\,||.)\d{1,2})?\s?€/g; //matches 22.90 €, 22.9 €, 22.9€, 22€, 22 € 1000€ 100 000€ 100 000.02€

    elements.forEach(element => {
        // For elements without children
        if (element.children.length==0 && element.textContent.match(pricePattern)) {

            let prices = element.textContent.match(pricePattern);

            prices.forEach(price => {
                const useComma = price.includes(','); // if the price is written with a comma
                let originalPrice = price.replace('€', '').replace(/\s+/g, '') // Remove € and all white spaces

                if (useComma){
                    originalPrice = originalPrice.replace(',', '.');  //replace , with .
                }  

                let roundedPrice = roundPrice(Number(originalPrice)); // Round the price

                let textPrice  = roundedPrice.toFixed(2)  + '€'; // add the euro symbol back

                if (useComma){
                    textPrice = textPrice.replace(".", ",")
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
                let originalPrice = priceText.replace('€', '').replace(',', '.').replace(/\s+/g, '');

                let roundedPrice = roundPrice(Number(originalPrice)); // Round the price

                // Replace the original price in the element's text content
                element.firstChild.data = element.firstChild.data.replace(priceText, roundedPrice.toFixed(2).replace(".", ",") + '€');
            })
        }

        // handle amazon weird price display
        else if(element.classList.contains('a-price')){
            let priceContainer = element.querySelector('span[aria-hidden="true"]');
            if (priceContainer.children.length > 0){ // ignore simple prices that were already handled by the first case
                
                //reconstruct the price from amazon weird price display
                let priceText = (priceContainer.getElementsByClassName('a-price-whole')[0].textContent.replace(/\s+/g, '') +
                                "," + priceContainer.getElementsByClassName('a-price-fraction')[0].textContent).replace(',,',',').replace(",",".");
                let roundedPrice = roundPrice(Number(priceText)); // Round the price
                priceContainer.innerHTML = roundedPrice.toFixed(2).replace(".", ",") + '€' // replace the complicated spans with some texts
            }
        }
    });
}

function roundPrice(price) {
    // For prices over 200, round to the nearest ten if the units are more that 4.9 (295€ => 300€)
    if (price > 200 && price % 10 > 4.9) {
        price = Math.ceil(price / 10) * 10;
    }
    
    // For prices over 80, round to the nearest ten if the units are close to rounding up (88€ => 90€)
    if (price > 80 && price % 10 > 7) {
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

// browser.runtime.onMessage.addListener((message) => {
//     console.log("Message received in background script:", message);
//     console.log("Sender information:", sender);


//     if (message.command === "toggle") {
//       console.log("toggle on");
//     }
// })



// function handleMessage(request, sender, sendResponse) {
//     console.log(`A content script sent a message: ${request}`);
//     // sendResponse({ response: "Response from background script" });
//   }
  
// console.log("Background script successfully running");
// browser.runtime.onMessage.addListener(handleMessage);




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
// Initialize MutationObserver
const observer = new MutationObserver(handleNewNodes);

// Start observing the body for child additions
observer.observe(document.body, {
    childList: true,
    subtree: true
});

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