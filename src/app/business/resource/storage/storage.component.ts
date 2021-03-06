import { Router } from '@angular/router';
import { Component, OnInit, ViewContainerRef, ViewChild, Directive, ElementRef, HostBinding, HostListener } from '@angular/core';
import { I18NService, ParamStorService} from 'app/shared/api';
import { Http } from '@angular/http';
import { trigger, state, style, transition, animate} from '@angular/animations';

@Component({
    selector: 'storage-table',
    templateUrl: './storage.html',
    styleUrls: [],
    animations: [
        trigger('overlayState', [
            state('hidden', style({
                opacity: 0
            })),
            state('visible', style({
                opacity: 1
            })),
            transition('visible => hidden', animate('400ms ease-in')),
            transition('hidden => visible', animate('400ms ease-out'))
        ]),
    
        trigger('notificationTopbar', [
            state('hidden', style({
            height: '0',
            opacity: 0
            })),
            state('visible', style({
            height: '*',
            opacity: 1
            })),
            transition('visible => hidden', animate('400ms ease-in')),
            transition('hidden => visible', animate('400ms ease-out'))
        ])
    ]
})
export class StorageComponent implements OnInit{

    storages = [];

    constructor(
        public I18N: I18NService,
        private http: Http,
        private paramStor: ParamStorService
    ){}
    
    ngOnInit() {
        this.storages = [];

        this.listStorage();
    }

    listStorage(){
        this.storages = [];
        let reqUser: any = { params:{} };
        let user_id = this.paramStor.CURRENT_USER().split("|")[1];
        this.http.get("/v3/users/"+ user_id +"/projects", reqUser).subscribe((objRES) => {
            let project_id;
            objRES.json().projects.forEach(element => {
                if(element.name == "admin"){
                    project_id = element.id;
                }
            })

            let reqPool: any = { params:{} };
            this.http.get("/v1beta/"+ project_id +"/pools", reqPool).subscribe((poolRES) => {
                let reqDock: any = { params:{} };
                let p1 = this.http.get("/v1beta/"+ project_id +"/docks", reqDock).toPromise();
                let p2 = this.http.get("/v1/"+ project_id +"/backends").toPromise();
                Promise.all([p1,p2]).then((result)=>{
                    let dockRES = result[0].json();
                    let backends = result[1].json().backends;
                    dockRES.forEach(ele => {
                        let zone = poolRES.json().filter((pool)=>{
                            return pool.dockId == ele.id;
                        })[0].availabilityZone;
                        let [name,ip,status,description,region,az,type] = [ele.name, ele.endpoint.split(":")[0], "Enabled", ele.description, "default_region", zone,"opensds"];
                        this.storages.push({name,ip,status,description,region,az,type});
                    });
                    backends.forEach(ele => {
                        let [name,ip,status,description,region,az,type] = [ele.name, ele.endpoint, "Enabled", ele.description ? ele.description: "--" , ele.region, "--",ele.type];
                        this.storages.push({name,ip,status,description,region,az,type});
                    });
                }).catch(function(e){
                    console.log(e);
                })
            })
        })
    }
    
}

