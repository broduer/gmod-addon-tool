// Global Variables
const {
    remote,
    ipcRenderer,
    files
} = require('electron')
const settings = require('electron-settings');
const shell = require('electron').shell;
let win = remote.getCurrentWindow()

addon_data = []
okToProcessAddonList = false
donePopulatingAddonList = false
currentNewAddon = "";


// assuming $ is jQuery
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});


$(document).ready(() => {
    ipcRenderer.on('message', (event, message) => {
        
        var arrayOfAddonIds = message;
        
        for (let index = 0; index < arrayOfAddonIds.length; index++) {
            $.ajax({
                type: 'POST',
                url: 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
                data: {
                    'itemcount': 1,
                    'publishedfileids[0]': parseInt(arrayOfAddonIds[index])
                },
                success: function success(data) {
                    var addon = data.response.publishedfiledetails["0"]
                    if (addon.result == 1) {
                        for (let i = 0; i < Object.keys(data).length; i++) {
                            var addonObject = {
                                "title": addon.title,
                                "id": addon.publishedfileid
                            }
                            addon_data.push(addonObject);
                        }
                    }
                },
                error: function (err) {
                    
                },
                dataType: 'json',
            });
        }
        okToProcessAddonList = true;
        $('#update_existing_addon_button').text('Update existing addon')
    });

    if (settings.get('gmodDirectory') != null) {
        $('#addon_management').fadeIn()
        ipcRenderer.send('getAddonInfo')
    } else {
        $('#directory_selection').fadeIn()
    }

    $('#closeApp').click(() => {
        window.close()
    })

    $('#minApp').click(() => {
        remote.getCurrentWindow().minimize();
    })

    $('.fake_select').click((event) => {
        var foo = event.target
        var foo2 = $(foo).data('buttonclick')
        $(foo2).click();
    })

    $('#gmod_dir_folder').change(() => {
        var filePath = document.getElementById("gmod_dir_folder").files[0].path
        var desName = filePath.substring(filePath.length - 9, filePath.length)
        ipcRenderer.send('checkIfDirectoryExists', filePath + "\\bin\\gmad.exe")
        ipcRenderer.send('checkIfDirectoryExists', filePath + "\\bin\\gmpublish.exe")
        if (desName == "GarrysMod") {
            $('#status_of_dir').css('color', 'lightgreen')
            $('#status_of_dir').text('Found gmad.exe and gmpublish.exe!')
            $('#dir_prompt_next button').css('background-color', '#56bd56')
            $('#dir_prompt_next button').prop('disabled', false)
            $('#dir_prompt_next button').css('cursor', 'pointer')
            $('#checkmarkNote').fadeIn(() => {
                $('#checkmarkNote').delay(1000).fadeOut();
            })
            settings.set('gmodDirectory', filePath);
            ipcRenderer.send('getAddonInfo')
        } else {
            $('#status_of_dir').css('color', 'red')
            $('#status_of_dir').text("Can't find gmad.exe or gmpublish.exe!")
            console.log(filePath)
            $('#dir_prompt_next button').prop('disabled', true)
            $('#dir_prompt_next button').css('cursor', 'not-allowed')
        }
    })

    $('#addon_dir_folder').change(() => {
        currentNewAddon = document.getElementById("addon_dir_folder").files[0].path
        ipcRenderer.send('checkIfDirectoryExists', currentNewAddon)
        var n = currentNewAddon.lastIndexOf('\\');
        var result = currentNewAddon.substring(n + 1);
        $('#addonDir b').text(result);
        $('#addonDirCheck').css('background-color', '#56bd56')
        $('#addonDirCheck').prop('disabled', false)
        $('#addonDirCheck').css('cursor', 'pointer')
    })

    $('#dir_prompt_next button').click(() => {
        $('#directory_selection').fadeOut(() => {
            $('#addon_management').fadeIn()
        });
    })

    $('#update_existing_addon_button').click(() => {
        if (okToProcessAddonList) {
            populateAddonList()
            $('#addon_management_prompt').fadeOut(() => {
                $('#update_existing_addon').fadeIn()
            })
        }
    });

    $('#create_new_addon_button').click(() => {
        $('#addon_management_prompt').fadeOut(() => {
            $('#create_new_addon').fadeIn(() => {
                // win.setBounds({
                //     height: 300,
                // })
            })
        })
    })

    $('.back_button').click((event) => {
        var target = event.target
        var divToGoBack = $(target).data('forwards')
        var divToShow = $(target).data('backwards')
        goBack(divToGoBack, divToShow)
    })
    
    $('.transition_button').click((event) => {
        var target = event.target
        var divToGoBack = $(target).data('divtohide')
        var divToShow = $(target).data('divtoshow')
        goBack(divToGoBack, divToShow)
    })

    $('.removeBackOption').click(() => {
        $('#back_button_addon_creation').fadeOut();
    })

    function goBack(divToFadeOut, divToFadeIn) {
        $(divToFadeOut).fadeOut(() => {
            $(divToFadeIn).fadeIn();
        })
    }

    function populateAddonList() {
        if (!donePopulatingAddonList) {
            for (let i = 0; i < addon_data.length; i++) {
                $('#yourAddons').append("<div class='addon_existing'><p>" + addon_data[i].title + "</p></div>")
                donePopulatingAddonList = true;
            }
    
            if (0 == addon_data.length) {
                $('#yourAddons').append("<p style='background-color: #0f0f0f; padding: 15px 10px; margin: 10px 15px; border-radius: 5px;'><b>No addons found!</b><br/><br/>Either you don't have Steam open or haven't uploaded anything.</p>")
                donePopulatingAddonList = true;
            }
        }
    }


    // $('.type').click((event) => {
    //     console.log(event)
    // })
});