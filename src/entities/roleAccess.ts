import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
  } from "typeorm";
import { Roles } from "./roles";

  
  @Entity({ name: "RolesAccess" })
  export class RolesAccess {
  
    @PrimaryGeneratedColumn('uuid')
    id!: string;
    
    @ManyToOne(() => Roles, dep => dep.RolesAccess)
    @JoinColumn({name: "RoleId"})
    RoleId!: Roles;
  
    @Column({ type: "nvarchar", length: 200, default: null })
    District!: string;
  
    @Column({ type: "nvarchar", length: 200, default: null })
    Taluk!: string;
  
    @Column({ type: "nvarchar", length: 200, default: null })
    Phco!: string;
  
    @Column({ type: "nvarchar", length: 200, default: null })
    SubCenter!: string;
  
    @Column({ type: "nvarchar", length: 200, default: null })
    Type!: string;

    @CreateDateColumn()
    CreatedDate!: Date;
  
    @UpdateDateColumn()
    UpdatedDate!: Date;
  };
  